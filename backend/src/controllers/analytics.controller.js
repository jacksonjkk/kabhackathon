import { asyncHandler } from "../lib/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm } from "../lib/farmScope.js";

const DAY_MS = 86_400_000;

const toDateKey = (date) => date.toISOString().slice(0, 10);

function buildTemperatureTrend(readings, days) {
  const buckets = new Map();
  for (const reading of readings) {
    const key = toDateKey(reading.capturedAt);
    if (!buckets.has(key)) buckets.set(key, { sum: 0, count: 0 });
    const bucket = buckets.get(key);
    bucket.sum += reading.temperatureC;
    bucket.count += 1;
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - 1 - index) * DAY_MS);
    const key = toDateKey(date);
    const bucket = buckets.get(key);
    return {
      date: key,
      avgTemperatureC: bucket ? Number((bucket.sum / bucket.count).toFixed(2)) : null,
      samples: bucket?.count ?? 0,
    };
  });
}

// Revised scope: herd health overview for abnormal-pattern monitoring only.
// Vaccination / inventory / reproduction aggregates removed (moved to Future Enhancements).
export const getOverview = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [
    cattleTotal,
    healthGroups,
    unreadAlerts,
    recentAlerts,
    readings,
    abnormalPredictions7d,
    alertsLast7d,
  ] = await Promise.all([
    prisma.cattle.count({ where: { farmId: farm.id } }),
    prisma.cattle.groupBy({
      by: ["healthStatus"],
      _count: { _all: true },
      where: { farmId: farm.id },
    }),
    prisma.alert.count({ where: { farmId: farm.id, isRead: false, type: "HEALTH" } }),
    prisma.alert.findMany({
      where: { farmId: farm.id, type: "HEALTH" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { cattle: { select: { tagNumber: true, name: true } } },
    }),
    prisma.thermalReading.findMany({
      where: { cattle: { farmId: farm.id }, capturedAt: { gte: weekAgo } },
      select: { temperatureC: true, activityLevel: true, capturedAt: true, anomaly: true, prediction: true },
      orderBy: { capturedAt: "asc" },
    }),
    prisma.prediction.count({
      where: { cattle: { farmId: farm.id }, label: "ABNORMAL", createdAt: { gte: weekAgo } },
    }),
    prisma.alert.findMany({
      where: { farmId: farm.id, type: "HEALTH", createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),
  ]);

  const healthDistribution = Object.fromEntries(
    healthGroups.map((group) => [group.healthStatus, group._count._all])
  );

  const temperatureTrend = buildTemperatureTrend(readings, 7);

  const anomalyCount7d = readings.filter((r) => r.anomaly || r.prediction === "ABNORMAL").length;
  const avgTemperatureC =
    readings.length > 0
      ? Number(
          (
            readings.reduce((sum, r) => sum + r.temperatureC, 0) / readings.length
          ).toFixed(2)
        )
      : null;
  const activitySamples = readings.filter((r) => r.activityLevel != null);
  const avgActivityLevel =
    activitySamples.length > 0
      ? Number(
          (
            activitySamples.reduce((sum, r) => sum + r.activityLevel, 0) / activitySamples.length
          ).toFixed(2)
        )
      : null;

  const alertTrendBuckets = new Map();
  for (let i = 6; i >= 0; i -= 1) {
    alertTrendBuckets.set(toDateKey(new Date(now.getTime() - i * DAY_MS)), 0);
  }
  for (const alert of alertsLast7d) {
    const key = toDateKey(alert.createdAt);
    if (alertTrendBuckets.has(key)) alertTrendBuckets.set(key, alertTrendBuckets.get(key) + 1);
  }

  res.json({
    summary: {
      cattleTotal,
      healthy: healthDistribution.HEALTHY ?? 0,
      atRisk:
        (healthDistribution.SICK ?? 0) +
        (healthDistribution.UNDER_TREATMENT ?? 0) +
        (healthDistribution.QUARANTINED ?? 0),
      unreadAlerts,
      avgTemperatureC,
      avgActivityLevel,
      temperatureAnomalies7d: anomalyCount7d,
      abnormalPatternsML7d: abnormalPredictions7d,
    },
    healthDistribution,
    temperatureTrend,
    alertTrend: Array.from(alertTrendBuckets.entries()).map(([date, count]) => ({ date, count })),
    recentAlerts,
  });
});
