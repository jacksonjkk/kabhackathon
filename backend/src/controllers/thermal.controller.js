import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm } from "../lib/farmScope.js";
import { env } from "../config/env.js";
import { getPagination, paginated } from "../lib/pagination.js";
import { createAlert, SEVERITY_ORDER } from "../services/alert.service.js";

const DAY_MS = 86_400_000;
// Suppress duplicate early warnings for the same animal for 6 hours unless severity escalates.
const ALERT_COOLDOWN_MS = 6 * 3_600_000;

// CORE sensor payload. Model is trained/served outside the backend, so ML fields are
// optional: the external model can either (a) include prediction inline, or
// (b) POST separately to /thermaguard/predictions. Threshold fallback keeps old clients working.
const readingSchema = z.object({
  cattleId: z.string().min(1),
  temperatureC: z.number().min(25).max(45),
  ambientC: z.number().min(-40).max(60).nullish(),
  activityLevel: z.number().min(0).max(100000).nullish(),
  humidity: z.number().min(0).max(100).nullish(),
  deviceId: z.string().max(80).nullish(),
  capturedAt: z.coerce.date().optional(),
  imageUrl: z.string().max(300).nullish(),
  // Optional inline ML output from the external model. ABNORMAL = abnormal health
  // pattern needing a check — never a disease diagnosis.
  prediction: z.enum(["NORMAL", "ABNORMAL"]).nullish(),
  anomalyScore: z.number().min(0).max(1).nullish(),
  modelVersion: z.string().max(60).nullish(),
});

const predictionSchema = z.object({
  cattleId: z.string().min(1),
  readingId: z.string().nullish(),
  label: z.enum(["NORMAL", "ABNORMAL"]),
  anomalyScore: z.number().min(0).max(1).nullish(),
  modelVersion: z.string().max(60).default("external-v1"),
  featuresJson: z.string().max(8000).nullish(),
});

// Threshold fallback only — used when no ML prediction is supplied.
// The ML model (trained outside) is the primary detector; this keeps the API usable
// for manual/IoT ingestion before the model scores the reading.
function fallbackClassify(temperatureC) {
  if (temperatureC >= env.feverThresholdC + 0.8) {
    return { anomaly: true, riskLevel: "CRITICAL", condition: "critical fever pattern" };
  }
  if (temperatureC >= env.feverThresholdC) {
    return { anomaly: true, riskLevel: "HIGH", condition: "fever pattern" };
  }
  if (temperatureC < 37.0) {
    return { anomaly: true, riskLevel: "MEDIUM", condition: "abnormally low temperature pattern" };
  }
  return { anomaly: false, riskLevel: "LOW", condition: "normal pattern" };
}

function severityFromPrediction(label, anomalyScore, fallbackRisk) {
  if (label === "ABNORMAL") {
    if ((anomalyScore ?? 0) >= 0.9 || fallbackRisk === "CRITICAL") return "CRITICAL";
    if ((anomalyScore ?? 0) >= 0.7 || fallbackRisk === "HIGH") return "HIGH";
    return "MEDIUM";
  }
  return fallbackRisk === "LOW" ? "LOW" : fallbackRisk;
}

async function recentHealthAlert(farmId, cattleId, title) {
  return prisma.alert.findFirst({
    where: {
      farmId,
      cattleId,
      type: "HEALTH",
      title,
      createdAt: { gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Auto-score a reading through the Python inference service (serves the
// trained .pkl models). Returns the service result or null when the service
// is disabled/unreachable — callers must fall back to threshold logic.
async function scoreViaInferenceService({ cattle, reading }) {
  const base = (env.inferenceUrl || "").replace(/\/+$/, "");
  if (!base) return null;
  try {
    const prior = await prisma.thermalReading.findMany({
      where: { cattleId: cattle.id, id: { not: reading.id } },
      orderBy: { capturedAt: "desc" },
      take: 200,
      select: { temperatureC: true, activityLevel: true, ambientC: true, humidity: true, capturedAt: true },
    });
    const res = await fetch(`${base}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperatureC: reading.temperatureC,
        activityLevel: reading.activityLevel,
        ambientC: reading.ambientC,
        humidity: reading.humidity,
        capturedAt: reading.capturedAt,
        history: prior.reverse(),
        model: "rf",
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const result = await res.json();
    if (result?.label !== "NORMAL" && result?.label !== "ABNORMAL") return null;
    return result;
  } catch {
    return null;
  }
}

// Plain-language likely driver for a flag: the single sentence humans read to
// understand WHY a point is red. Shared rules — the frontend mirrors these
// bands for display; the backend persists the verdict on predictions/alerts.
function driverFor({ temp, label, fromModel }) {
  if (temp >= env.feverThresholdC + 0.8) return `Critical high temp (${temp}°C)`;
  if (temp >= env.feverThresholdC) return `Fever-range temp (${temp}°C)`;
  if (temp < 37.0) return `Abnormally low temp (${temp}°C)`;
  if (fromModel && label === "ABNORMAL") {
    return `Combined pattern shift vs own baseline (temp ${temp}°C looks normal alone)`;
  }
  return `Threshold anomaly at ${temp}°C`;
}

// Reproductive guard: estrus and pregnancy shift baselines and can mimic
// fever (research: estrus spikes 0.3-1.3C for ~8-10h with HIGH activity;
// pre-calving core temp drops ~1C 10-20h before parturition). This runs AFTER
// detection and only re-labels the alert — it never suppresses it.
// Returns adjusted {severity, title, message, source, reproTag}.
async function applyReproGuard({ cattle, reading, severity, title, message, source }) {
  const out = { severity, title, message, source, reproTag: null, forceFire: false, driver: null };
  if (env.reproGuardEnabled === false) return out;

  const since = new Date(Date.now() - 48 * 3_600_000);
  const recent = await prisma.observation.findMany({
    where: { cattleId: cattle.id, createdAt: { gte: since } },
    select: { note: true },
    take: 10,
  });
  const text = recent.map((o) => (o.note || "").toLowerCase()).join(" | ");
  // Sick/heat keywords in every UI language (must mirror the caretaker sign
  // chips in Frontend/src/locales/*.json — keep in sync when chips change).
  // Deliberately distinctive tokens only ('joto' alone would false-positive on
  // temperature notes). lg/nyn lists are draft, pending native-speaker review.
  const hasSickSign = ["poor feeding", "off feed", "not eating", "diarrhea",
    "diarrhoea", "dull", "letharg", "nasal discharge", "labored", "coughing", "cough",
    "kutokula", "kuchechea", "kukohoa", "kuhara", "kamasi",
    "okutalya", "okuchechea", "okukolola", "ekidukano",
    "kutarya", "okukonka", "okukorora", "ekidukano"]
    .some((k) => text.includes(k));
  const hasHeatSign = ["seen in heat", "standing heat", "mounting", "in heat", "on heat",
    "kupandwa", "bwakya"]
    .some((k) => text.includes(k));
  const pregnant = (cattle.pregnancyStatus || "").toUpperCase() === "PREGNANT";
  const act = reading.activityLevel ?? null;
  const temp = reading.temperatureC;

  // Recent baseline from this cow's own history. Deliberately uses OLD readings
  // only (>20h) so an ongoing event cannot contaminate the baseline it is
  // measured against; needs >=4 points or the baseline-relative checks defer
  // to absolute-value rules.
  let baseTemp = null;
  let actMean24 = null;
  let actCount24 = 0;
  try {
    // take must span the 20h cutoff (multi-day histories accumulate).
    const rows = await prisma.thermalReading.findMany({
      where: { cattleId: cattle.id },
      orderBy: { capturedAt: "desc" },
      take: 200,
      select: { temperatureC: true, activityLevel: true, capturedAt: true },
    });
    const cutoff20h = Date.now() - 20 * 3_600_000;
    const oldTemps = rows.filter((r) => new Date(r.capturedAt).getTime() < cutoff20h)
      .map((r) => r.temperatureC);
    if (oldTemps.length >= 4) baseTemp = oldTemps.reduce((a, b) => a + b, 0) / oldTemps.length;
    const acts = rows.map((r) => r.activityLevel).filter((v) => v != null);
    actCount24 = acts.length;
    if (acts.length >= 12) actMean24 = acts.reduce((a, b) => a + b, 0) / acts.length;
  } catch {
    // History unavailable — fall through to absolute-value rules only.
  }

  // Pre-calving watch: pregnant cow with abnormally LOW temperature, either
  // absolute or as a >=0.7C drop from her own recent baseline (research:
  // ~1C drop 10-20h before parturition).
  const calvingDrop = baseTemp != null && baseTemp - temp >= 0.7;
  if (pregnant && (temp <= env.calvingLowTemp || calvingDrop)) {
    out.severity = "HIGH";
    out.title = `Possible calving watch · ${cattle.tagNumber}`;
    out.message =
      `${cattle.name ?? cattle.tagNumber} is recorded pregnant and body temperature ` +
      `dropped to ${temp}°C` +
      (calvingDrop && baseTemp != null ? ` (down from a recent baseline near ${baseTemp.toFixed(1)}°C)` : "") +
      `. A drop of ~1°C can precede calving by 10-20h, so ` +
      `prepare a calving check. Early warning, not a diagnosis.`;
    out.reproTag = "CALVING_WATCH";
    out.forceFire = true; // fires even when ML + thresholds stay quiet
    out.driver = `Pre-calving temp drop (${temp}°C` +
      (calvingDrop && baseTemp != null ? `, down from ~${baseTemp.toFixed(1)}°C baseline` : "") + `)`;
    return out;
  }

  // Activity collapse (lameness/injury screen): movement far below the cow's
  // own recent mean while temperature looks normal. Strictly baseline-relative
  // (an absolute floor would fire every night when cows rest near ~5), needs
  // enough history to trust the mean, and is only evaluated during active
  // hours (05:00-20:00) so normal night rest never flags. Health path.
  const readingHour = new Date(reading.capturedAt || Date.now()).getHours();
  const inActiveHours =
    readingHour >= env.lamenessActiveStart && readingHour < env.lamenessActiveEnd;
  if (
    inActiveHours &&
    act != null && actMean24 != null && actMean24 > 15 && actCount24 >= 12 &&
    act < 0.3 * actMean24
  ) {
    out.severity = act < 0.2 * actMean24 ? "HIGH" : "MEDIUM";
    out.title = `Low activity: possible lameness · ${cattle.tagNumber}`;
    out.message =
      `${cattle.name ?? cattle.tagNumber} is moving far less than usual ` +
      `(now ${act}, recent mean ~${actMean24.toFixed(0)}) with body temperature ` +
      `${temp}°C. Check legs, hooves, and movement for lameness or injury. ` +
      `Early warning, not a diagnosis.`;
    out.forceFire = true;
    out.driver = `Activity collapse (now ${act} vs usual ~${actMean24.toFixed(0)})`;
    return out;
  }

  // Caretaker-confirmed heat: agree, don't contradict with a sickness scare.
  if (hasHeatSign && !pregnant) {
    out.severity = "MEDIUM";
    out.title = `Possible estrus (heat) · ${cattle.tagNumber}`;
    out.message =
      `${cattle.name ?? cattle.tagNumber} shows an elevated pattern (${temp}°C) ` +
      `and heat was observed by the caretaker. Likely estrus, not illness. Monitor for standing heat. Early warning, not a diagnosis.`;
    out.reproTag = "LIKELY_ESTRUS";
    out.driver = `Restlessness + elevated temp (${temp}°C), likely heat`;
    return out;
  }

  // Estrus candidate: sub-critical rise + restlessness + still eating + cycling.
  if (
    !pregnant && !hasSickSign &&
    temp <= env.estrusTempMax &&
    act != null && act >= env.estrusActivityMin
  ) {
    out.severity = "MEDIUM";
    out.title = `Possible estrus (heat) · ${cattle.tagNumber}`;
    out.message =
      `${cattle.name ?? cattle.tagNumber} shows elevated temperature (${temp}°C) ` +
      `with HIGH activity (${act}) and no off-feed signs logged in the last 48h. ` +
      `This pattern fits estrus (heat) better than illness. Check for mounting/` +
      `standing heat rather than treating. Early warning, not a diagnosis.`;
    out.reproTag = "ESTRUS_CANDIDATE";
    out.driver = `Restlessness (${act}) + mild temp rise (${temp}°C), likely heat`;
    return out;
  }

  return out;
}

async function raiseEarlyWarning({ farm, cattle, data, fallback, predictionRow, reading = null }) {
  const mlAbnormal = predictionRow ? predictionRow.label === "ABNORMAL" : null;

  const fromModel = mlAbnormal === true;
  const baseSeverity = fromModel
    ? severityFromPrediction(predictionRow.label, predictionRow.anomalyScore, fallback.riskLevel)
    : fallback.riskLevel === "MEDIUM"
      ? "MEDIUM"
      : fallback.riskLevel;

  const scoreText =
    predictionRow?.anomalyScore != null ? ` (anomaly score ${predictionRow.anomalyScore})` : "";
  const baseTitle = `Abnormal health pattern · ${cattle.tagNumber}`;
  const baseMessage =
    `${cattle.name ?? cattle.tagNumber} shows an abnormal health pattern${scoreText} ` +
    `(body temp ${data.temperatureC}°C). Please check the animal. ` +
    `This is an early warning, not a diagnosis.` +
    (fromModel ? ` Model ${predictionRow.modelVersion}.` : " Threshold safety net (ML did not flag).");

  // Reproductive guard runs FIRST (one small indexed history read): its
  // baseline-relative checks (calving drop, activity collapse) can force a
  // warning even when ML and thresholds stay quiet — e.g. a slow pre-calving
  // slide the model absorbs into baseline, or lameness with normal temp.
  // Cooldown below then uses the final label.
  const guarded = await applyReproGuard({
    cattle,
    reading: {
      temperatureC: data.temperatureC,
      activityLevel: reading?.activityLevel ?? data.activityLevel ?? null,
      capturedAt: reading?.capturedAt ?? data.capturedAt ?? new Date(),
    },
    severity: baseSeverity,
    title: baseTitle,
    message: baseMessage,
    source: fromModel ? "MODEL" : "THRESHOLD",
  });

  // Either detector can fire: the high-precision ML model catches pattern
  // anomalies, the threshold fallback catches obvious extremes the model may
  // miss (recall ~0.5 at the default operating point), and the guard forces
  // calving-drop / activity-collapse warnings.
  const isAbnormal = mlAbnormal === true || fallback.anomaly || guarded.forceFire === true;
  if (!isAbnormal) return { alertCreated: false, alert: null };

  // Human-readable driver, persisted on the prediction and inside the alert
  // message so every surface (charts, tables, alerts) can say WHY it is red.
  const driver = guarded.driver ?? driverFor({
    temp: data.temperatureC,
    label: predictionRow?.label,
    fromModel,
  });
  guarded.message += ` Likely driver: ${driver}.`;
  if (predictionRow) {
    await prisma.prediction.update({
      where: { id: predictionRow.id },
      data: { reason: driver },
    });
  }

  // Cooldown is per alert class (title): repeats of the identical warning are
  // deduplicated, different classes keep their own streams, and a higher
  // severity within the window escalates the existing alert in place.
  const recent = await recentHealthAlert(farm.id, cattle.id, guarded.title);
  if (recent) {
    if (SEVERITY_ORDER.indexOf(guarded.severity) > SEVERITY_ORDER.indexOf(recent.severity)) {
      const escalated = await prisma.alert.update({
        where: { id: recent.id },
        data: { severity: guarded.severity, message: guarded.message },
      });
      return { alertCreated: false, alert: escalated, escalated: true };
    }
    return { alertCreated: false, alert: recent };
  }

  const alert = await createAlert({
    farmId: farm.id,
    cattleId: cattle.id,
    type: "HEALTH",
    source: guarded.source,
    severity: guarded.severity,
    title: guarded.title,
    message: guarded.message,
    predictionId: fromModel ? predictionRow?.id ?? null : null,
  });

  // Only genuine health scares flip herd status — estrus/calving watches don't.
  if (cattle.healthStatus === "HEALTHY" && guarded.reproTag === null) {
    await prisma.cattle.update({
      where: { id: cattle.id },
      data: { healthStatus: "SICK" },
    });
  }
  return { alertCreated: true, alert };
}

export const createReading = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const data = readingSchema.parse(req.body);

  const cattle = await prisma.cattle.findFirst({
    where: { id: data.cattleId, farmId: farm.id },
  });
  if (!cattle) throw new HttpError(404, "Cattle not found in your farm");

  const fallback = fallbackClassify(data.temperatureC);

  const reading = await prisma.thermalReading.create({
    data: {
      cattleId: cattle.id,
      temperatureC: data.temperatureC,
      ambientC: data.ambientC ?? null,
      activityLevel: data.activityLevel ?? null,
      humidity: data.humidity ?? null,
      deviceId: data.deviceId ?? null,
      imageUrl: data.imageUrl ?? null,
      capturedAt: data.capturedAt ?? new Date(),
      anomaly: data.prediction ? data.prediction === "ABNORMAL" : fallback.anomaly,
      riskLevel: data.prediction
        ? severityFromPrediction(data.prediction, data.anomalyScore, fallback.riskLevel)
        : fallback.riskLevel,
      prediction: data.prediction ?? null,
      anomalyScore: data.anomalyScore ?? null,
      modelVersion: data.modelVersion ?? null,
    },
  });

  let predictionRow = null;
  let scoredViaService = null;
  if (data.prediction) {
    predictionRow = await prisma.prediction.create({
      data: {
        cattleId: cattle.id,
        readingId: reading.id,
        label: data.prediction,
        anomalyScore: data.anomalyScore ?? null,
        modelVersion: data.modelVersion ?? "external-v1",
      },
    });
  } else {
    // No inline ML output: ask the inference service (trained .pkl models).
    // When it is down/disabled we silently keep the threshold fallback below.
    const scored = await scoreViaInferenceService({ cattle, reading });
    if (scored) {
      scoredViaService = scored;
      predictionRow = await prisma.prediction.create({
        data: {
          cattleId: cattle.id,
          readingId: reading.id,
          label: scored.label,
          anomalyScore: scored.anomalyScore ?? null,
          modelVersion: scored.modelVersion ?? "external-v1",
        },
      });
      await prisma.thermalReading.update({
        where: { id: reading.id },
        data: {
          prediction: scored.label,
          anomalyScore: scored.anomalyScore ?? null,
          modelVersion: scored.modelVersion ?? null,
          anomaly: scored.label === "ABNORMAL",
          riskLevel: severityFromPrediction(scored.label, scored.anomalyScore, fallback.riskLevel),
        },
      });
    }
  }

  const { alertCreated } = await raiseEarlyWarning({ farm, cattle, data, fallback, predictionRow, reading });

  res.status(201).json({
    ...reading,
    ...(scoredViaService
      ? {
          prediction: scoredViaService.label,
          anomalyScore: scoredViaService.anomalyScore ?? null,
          modelVersion: scoredViaService.modelVersion ?? null,
          anomaly: scoredViaService.label === "ABNORMAL",
          riskLevel: severityFromPrediction(scoredViaService.label, scoredViaService.anomalyScore, fallback.riskLevel),
          scoredBy: "MODEL",
        }
      : { scoredBy: data.prediction ? "MODEL" : "THRESHOLD" }),
    fallback,
    alertCreated,
  });
});

// Endpoint for the externally trained/served model (or a relay job) to submit inference.
// Keeps model training outside the backend per project plan; backend stores + serves + alerts.
export const createPrediction = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const data = predictionSchema.parse(req.body);

  const cattle = await prisma.cattle.findFirst({
    where: { id: data.cattleId, farmId: farm.id },
    include: { thermalReadings: { orderBy: { capturedAt: "desc" }, take: 1 } },
  });
  if (!cattle) throw new HttpError(404, "Cattle not found in your farm");

  let readingId = data.readingId ?? null;
  if (readingId) {
    const reading = await prisma.thermalReading.findFirst({
      where: { id: readingId, cattleId: cattle.id },
    });
    if (!reading) throw new HttpError(404, "Reading not found for this animal");
  }

  const prediction = await prisma.prediction.create({
    data: {
      cattleId: cattle.id,
      readingId,
      label: data.label,
      anomalyScore: data.anomalyScore ?? null,
      modelVersion: data.modelVersion,
      featuresJson: data.featuresJson ?? null,
    },
  });

  // Mirror latest ML state onto the reading so trends/alerts stay consistent.
  if (readingId) {
    await prisma.thermalReading.update({
      where: { id: readingId },
      data: {
        prediction: data.label,
        anomalyScore: data.anomalyScore ?? null,
        modelVersion: data.modelVersion,
        anomaly: data.label === "ABNORMAL",
        riskLevel: severityFromPrediction(data.label, data.anomalyScore, "LOW"),
      },
    });
  }

  const latest = cattle.thermalReadings[0];
  const { alertCreated } = await raiseEarlyWarning({
    farm,
    cattle,
    data: { temperatureC: latest?.temperatureC ?? 0 },
    fallback: { anomaly: false, riskLevel: "LOW" },
    predictionRow: prediction,
  });

  res.status(201).json({ ...prediction, alertCreated });
});

export const listPredictions = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const { page, limit, skip, take } = getPagination(req.query);

  const where = { cattle: { farmId: farm.id } };
  if (typeof req.query.cattleId === "string" && req.query.cattleId) {
    where.cattleId = req.query.cattleId;
  }
  if (typeof req.query.label === "string" && ["NORMAL", "ABNORMAL"].includes(req.query.label)) {
    where.label = req.query.label;
  }
  const days = Math.min(Math.max(Number.parseInt(String(req.query.days ?? "7"), 10) || 7, 1), 90);
  where.createdAt = { gte: new Date(Date.now() - days * DAY_MS) };

  const [total, rows] = await Promise.all([
    prisma.prediction.count({ where }),
    prisma.prediction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { cattle: { select: { id: true, tagNumber: true, name: true } } },
    }),
  ]);

  res.json(paginated(rows, total, page, limit));
});

export const listReadings = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const { page, limit, skip, take } = getPagination(req.query);

  const where = { cattle: { farmId: farm.id } };
  if (typeof req.query.cattleId === "string" && req.query.cattleId) {
    where.cattleId = req.query.cattleId;
  }
  if (String(req.query.anomalyOnly ?? "") === "true") {
    where.OR = [{ anomaly: true }, { prediction: "ABNORMAL" }];
  }
  const days = Math.min(Math.max(Number.parseInt(String(req.query.days ?? "7"), 10) || 7, 1), 90);
  where.capturedAt = { gte: new Date(Date.now() - days * DAY_MS) };

  const [total, rows] = await Promise.all([
    prisma.thermalReading.count({ where }),
    prisma.thermalReading.findMany({
      where,
      orderBy: { capturedAt: "desc" },
      skip,
      take,
      include: { cattle: { select: { id: true, tagNumber: true, name: true, photoUrl: true } } },
    }),
  ]);

  res.json(paginated(rows, total, page, limit));
});

export const getSummary = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const days = Math.min(Math.max(Number.parseInt(String(req.query.days ?? "7"), 10) || 7, 1), 90);
  const since = new Date(Date.now() - days * DAY_MS);

  const where = { cattle: { farmId: farm.id }, capturedAt: { gte: since } };
  if (typeof req.query.cattleId === "string" && req.query.cattleId) {
    const cattle = await prisma.cattle.findFirst({
      where: { id: req.query.cattleId, farmId: farm.id },
    });
    if (!cattle) throw new HttpError(404, "Cattle not found in your farm");
    where.cattleId = cattle.id;
  }

  const [aggregate, activityAgg, anomalyCount, abnormalPredictions] = await Promise.all([
    prisma.thermalReading.aggregate({
      where,
      _avg: { temperatureC: true },
      _min: { temperatureC: true },
      _max: { temperatureC: true },
      _count: { _all: true },
    }),
    prisma.thermalReading.aggregate({
      where,
      _avg: { activityLevel: true },
    }),
    prisma.thermalReading.count({ where: { ...where, anomaly: true } }),
    prisma.prediction.count({
      where: {
        cattle: { farmId: farm.id },
        label: "ABNORMAL",
        createdAt: { gte: since },
        ...(where.cattleId ? { cattleId: where.cattleId } : {}),
      },
    }),
  ]);

  res.json({
    periodDays: days,
    readings: aggregate._count._all,
    avgTemperatureC: aggregate._avg.temperatureC != null ? Number(aggregate._avg.temperatureC.toFixed(2)) : null,
    minTemperatureC: aggregate._min.temperatureC,
    maxTemperatureC: aggregate._max.temperatureC,
    avgActivityLevel: activityAgg._avg.activityLevel != null ? Number(activityAgg._avg.activityLevel.toFixed(2)) : null,
    anomalies: anomalyCount,
    abnormalPatternsML: abnormalPredictions,
    note: "Abnormal = early-warning pattern needing a check, not a diagnosis.",
  });
});
