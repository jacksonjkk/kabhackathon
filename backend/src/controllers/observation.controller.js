import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm } from "../lib/farmScope.js";
import { getPagination, paginated } from "../lib/pagination.js";

const observationSchema = z.object({
  cattleId: z.string().min(1),
  note: z.string().trim().min(1).max(2000),
  action: z.string().trim().max(200).nullish(),
});

export const listObservations = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const { page, limit, skip, take } = getPagination(req.query);
  const where = { cattle: { farmId: farm.id } };
  if (typeof req.query.cattleId === "string" && req.query.cattleId) {
    where.cattleId = req.query.cattleId;
  }
  const [total, rows] = await Promise.all([
    prisma.observation.count({ where }),
    prisma.observation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { cattle: { select: { id: true, tagNumber: true, name: true } } },
    }),
  ]);
  res.json(paginated(rows, total, page, limit));
});

export const createObservation = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const data = observationSchema.parse(req.body);
  const cattle = await prisma.cattle.findFirst({
    where: { id: data.cattleId, farmId: farm.id },
  });
  if (!cattle) throw new HttpError(404, "Cattle not found in your farm");
  const observation = await prisma.observation.create({
    data: {
      cattleId: cattle.id,
      note: data.note,
      action: data.action ?? null,
      createdBy: req.user.id,
    },
  });
  res.status(201).json(observation);
});
