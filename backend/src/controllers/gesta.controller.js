import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm } from "../lib/farmScope.js";
import { getPagination, paginated } from "../lib/pagination.js";
import { createAlert } from "../services/alert.service.js";

const PREGNANCY_STATUS_MAP = {
  PREGNANT: "PREGNANT",
  NOT_PREGNANT: "OPEN",
  INCONCLUSIVE: "CHECK_REQUIRED",
};

const examSchema = z.object({
  cattleId: z.string().min(1),
  method: z.enum(["ULTRASOUND", "AI_PREDICTION", "BIOMARKER", "VETERINARY_EXAM"]),
  result: z.enum(["PREGNANT", "NOT_PREGNANT", "INCONCLUSIVE"]),
  confidence: z.number().min(0).max(1).nullish(),
  daysSinceBreeding: z.number().int().min(0).max(400).nullish(),
  examDate: z.coerce.date().optional(),
  notes: z.string().trim().max(1000).nullish(),
});

export const createExam = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const data = examSchema.parse(req.body);

  const cattle = await prisma.cattle.findFirst({
    where: { id: data.cattleId, farmId: farm.id },
  });
  if (!cattle) throw new HttpError(404, "Cattle not found in your farm");

  const exam = await prisma.gestaCheck.create({
    data: { ...data, examDate: data.examDate ?? new Date() },
  });

  await prisma.cattle.update({
    where: { id: cattle.id },
    data: { pregnancyStatus: PREGNANCY_STATUS_MAP[data.result] },
  });

  if (data.result === "PREGNANT") {
    await createAlert({
      farmId: farm.id,
      cattleId: cattle.id,
      type: "HEALTH",
      severity: "LOW",
      title: "Pregnancy confirmed",
      message: `${cattle.name ?? cattle.tagNumber} was confirmed pregnant via ${data.method.replace("_", " ").toLowerCase()}.`,
    });
  } else if (data.result === "INCONCLUSIVE") {
    await createAlert({
      farmId: farm.id,
      cattleId: cattle.id,
      type: "HEALTH",
      severity: "MEDIUM",
      title: "Recheck recommended",
      message: `The pregnancy check for ${cattle.name ?? cattle.tagNumber} was inconclusive. Schedule a follow-up exam.`,
    });
  }

  res.status(201).json(exam);
});

export const listExams = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const { page, limit, skip, take } = getPagination(req.query);

  const where = { cattle: { farmId: farm.id } };
  if (typeof req.query.cattleId === "string" && req.query.cattleId) {
    where.cattleId = req.query.cattleId;
  }

  const [total, rows] = await Promise.all([
    prisma.gestaCheck.count({ where }),
    prisma.gestaCheck.findMany({
      where,
      orderBy: { examDate: "desc" },
      skip,
      take,
      include: { cattle: { select: { id: true, tagNumber: true, name: true, breed: true } } },
    }),
  ]);

  res.json(paginated(rows, total, page, limit));
});

export const predictPregnancy = asyncHandler(async (req, res) => {
  await requireFarm(req.user);

  const schema = z.object({
    daysSinceBreeding: z.number().int().min(0).max(400),
    bodyTempC: z.number().min(36).max(42).optional(),
    activityDropPct: z.number().min(0).max(100).optional(),
    milkDropPct: z.number().min(0).max(100).optional(),
  });

  const input = schema.parse(req.body);

  let probability = 0;
  const days = input.daysSinceBreeding;
  if (days >= 21 && days <= 30) probability += 0.15;
  else if (days <= 45) probability += 0.55;
  else probability += 0.65;

  if ((input.activityDropPct ?? 0) > 25) probability += 0.15;
  if ((input.milkDropPct ?? 0) > 15) probability += 0.1;
  if (input.bodyTempC != null && input.bodyTempC >= 38.6 && input.bodyTempC <= 39.0) {
    probability += 0.05;
  }

  probability = Math.min(probability, 0.98);

  const label =
    probability >= 0.6
      ? "PREGNANT_LIKELY"
      : probability >= 0.35
        ? "UNCERTAIN"
        : "NOT_PREGNANT_LIKELY";

  res.json({
    probability: Number(probability.toFixed(3)),
    label,
    model: "rule-based-v1",
    inputs: input,
  });
});
