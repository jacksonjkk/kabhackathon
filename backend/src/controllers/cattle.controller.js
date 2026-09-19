import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm } from "../lib/farmScope.js";
import { getPagination, paginated } from "../lib/pagination.js";

const cattleSchema = z.object({
  tagNumber: z.string().trim().min(1).max(40),
  name: z.string().trim().max(80).nullish(),
  breed: z.string().trim().max(80).nullish(),
  gender: z.enum(["FEMALE", "MALE"]),
  birthDate: z.coerce.date().nullish(),
  weightKg: z.number().positive().max(2000).nullish(),
  healthStatus: z.enum(["HEALTHY", "SICK", "UNDER_TREATMENT", "QUARANTINED"]).default("HEALTHY"),
  pregnancyStatus: z.enum(["OPEN", "PREGNANT", "CHECK_REQUIRED"]).nullish(),
  lactationStage: z.string().trim().max(40).nullish(),
  photoUrl: z.url().max(300).nullish(),
  notes: z.string().trim().max(1000).nullish(),
});

export const listCattle = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const { page, limit, skip, take } = getPagination(req.query);

  const where = { farmId: farm.id };
  const healthStatus = typeof req.query.healthStatus === "string" ? req.query.healthStatus.toUpperCase() : "";
  const gender = typeof req.query.gender === "string" ? req.query.gender.toUpperCase() : "";
  if (healthStatus) where.healthStatus = healthStatus;
  if (gender) where.gender = gender;

  let rows = await prisma.cattle.findMany({
    where,
    orderBy: { createdAt: "desc" },
    // Revised scope: herd list supports health monitoring only.
    // Vaccination joins removed (future enhancement, not core).
    include: {
      thermalReadings: { orderBy: { capturedAt: "desc" }, take: 1 },
      predictions: { orderBy: { createdAt: "desc" }, take: 1 },
      alerts: { where: { isRead: false }, take: 3, orderBy: { createdAt: "desc" } },
    },
  });

  const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
  if (search) {
    rows = rows.filter(
      (cow) =>
        cow.tagNumber.toLowerCase().includes(search) ||
        (cow.name ?? "").toLowerCase().includes(search) ||
        (cow.breed ?? "").toLowerCase().includes(search)
    );
  }

  const total = rows.length;
  const data = rows.slice(skip, skip + take).map(({ ...cow }) => ({
    ...cow,
    latestReading: cow.thermalReadings?.[0] ?? null,
    latestPrediction: cow.predictions?.[0] ?? null,
  }));

  res.json(paginated(data, total, page, limit));
});

export const createCattle = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const data = cattleSchema.parse(req.body);

  const duplicate = await prisma.cattle.findUnique({ where: { tagNumber: data.tagNumber } });
  if (duplicate) throw new HttpError(409, `Tag number ${data.tagNumber} is already in use`);

  const cattle = await prisma.cattle.create({
    data: { ...data, farmId: farm.id },
  });

  res.status(201).json(cattle);
});

export const getCattle = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const cattle = await prisma.cattle.findFirst({
    where: { id: req.params.id, farmId: farm.id },
    // Revised scope: cow detail = identity + sensor history + ML predictions + alerts + observations.
    include: {
      thermalReadings: { orderBy: { capturedAt: "desc" }, take: 30 },
      predictions: { orderBy: { createdAt: "desc" }, take: 20 },
      alerts: { orderBy: { createdAt: "desc" }, take: 20 },
      observations: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { alerts: true } },
    },
  });
  if (!cattle) throw new HttpError(404, "Cattle not found");

  res.json(cattle);
});

export const updateCattle = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const existing = await prisma.cattle.findFirst({
    where: { id: req.params.id, farmId: farm.id },
  });
  if (!existing) throw new HttpError(404, "Cattle not found");

  const data = cattleSchema.partial().parse(req.body);
  if (data.tagNumber && data.tagNumber !== existing.tagNumber) {
    const duplicate = await prisma.cattle.findUnique({ where: { tagNumber: data.tagNumber } });
    if (duplicate) throw new HttpError(409, `Tag number ${data.tagNumber} is already in use`);
  }
  if (Object.keys(data).length === 0) {
    throw new HttpError(422, "No changes provided");
  }

  const cattle = await prisma.cattle.update({
    where: { id: existing.id },
    data,
  });

  res.json(cattle);
});

export const deleteCattle = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const result = await prisma.cattle.deleteMany({
    where: { id: req.params.id, farmId: farm.id },
  });
  if (result.count === 0) throw new HttpError(404, "Cattle not found");

  res.status(204).send();
});
