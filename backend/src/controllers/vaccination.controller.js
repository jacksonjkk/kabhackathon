import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm } from "../lib/farmScope.js";
import { getPagination, paginated } from "../lib/pagination.js";
import { createAlert } from "../services/alert.service.js";

const DAY_MS = 86_400_000;
const UPCOMING_WINDOW_DAYS = 14;

const vaccinationSchema = z.object({
  cattleId: z.string().min(1),
  vaccineName: z.string().trim().min(1).max(120),
  doseDate: z.coerce.date(),
  nextDueDate: z.coerce.date().nullish(),
  vetName: z.string().trim().max(80).nullish(),
  batchNumber: z.string().trim().max(60).nullish(),
  notes: z.string().trim().max(1000).nullish(),
});

export const createVaccination = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const data = vaccinationSchema.parse(req.body);

  const cattle = await prisma.cattle.findFirst({
    where: { id: data.cattleId, farmId: farm.id },
  });
  if (!cattle) throw new HttpError(404, "Cattle not found in your farm");

  const now = new Date();
  const status =
    data.nextDueDate && data.nextDueDate < now ? "OVERDUE" : "SCHEDULED";

  const vaccination = await prisma.vaccination.create({
    data: { ...data, status },
  });

  if (status === "OVERDUE") {
    await createAlert({
      farmId: farm.id,
      cattleId: cattle.id,
      type: "VACCINATION",
      severity: "HIGH",
      title: "Overdue vaccination",
      message: `${data.vaccineName} for ${cattle.tagNumber} was due ${data.nextDueDate.toDateString()}.`,
    });
  } else if (
    data.nextDueDate &&
    data.nextDueDate.getTime() - now.getTime() < UPCOMING_WINDOW_DAYS * DAY_MS
  ) {
    await createAlert({
      farmId: farm.id,
      cattleId: cattle.id,
      type: "VACCINATION",
      severity: "MEDIUM",
      title: "Upcoming vaccination",
      message: `${data.vaccineName} for ${cattle.tagNumber} is due on ${data.nextDueDate.toDateString()}.`,
    });
  }

  res.status(201).json(vaccination);
});

export const listVaccinations = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const { page, limit, skip, take } = getPagination(req.query);

  const where = { cattle: { farmId: farm.id } };
  const status = typeof req.query.status === "string" ? req.query.status.toUpperCase() : "";
  if (status) where.status = status;
  if (typeof req.query.cattleId === "string" && req.query.cattleId) {
    where.cattleId = req.query.cattleId;
  }

  const [total, rows] = await Promise.all([
    prisma.vaccination.count({ where }),
    prisma.vaccination.findMany({
      where,
      orderBy: [{ nextDueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      skip,
      take,
      include: { cattle: { select: { id: true, tagNumber: true, name: true, breed: true } } },
    }),
  ]);

  res.json(paginated(rows, total, page, limit));
});

export const updateVaccination = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const existing = await prisma.vaccination.findFirst({
    where: { id: req.params.id, cattle: { farmId: farm.id } },
  });
  if (!existing) throw new HttpError(404, "Vaccination record not found");

  const schema = z
    .object({
      vaccineName: z.string().trim().min(1).max(120).optional(),
      doseDate: z.coerce.date().optional(),
      nextDueDate: z.coerce.date().nullable().optional(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
      vetName: z.string().trim().max(80).nullable().optional(),
      batchNumber: z.string().trim().max(60).nullable().optional(),
      notes: z.string().trim().max(1000).nullable().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, { message: "No changes provided" });

  const data = schema.parse(req.body);

  const vaccination = await prisma.vaccination.update({
    where: { id: existing.id },
    data,
    include: { cattle: { select: { id: true, tagNumber: true, name: true } } },
  });

  res.json(vaccination);
});

export const deleteVaccination = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const result = await prisma.vaccination.deleteMany({
    where: { id: req.params.id, cattle: { farmId: farm.id } },
  });
  if (result.count === 0) throw new HttpError(404, "Vaccination record not found");

  res.status(204).send();
});
