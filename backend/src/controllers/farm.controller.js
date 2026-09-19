import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm, canManageFarm } from "../lib/farmScope.js";

const farmSchema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().max(160).nullish(),
  // GPS is mandatory: weather backfill has no fallback town, so a farm
  // without coordinates would silently degrade every ML decision.
  // (Update uses .partial(), so existing farms add GPS via Settings.)
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sizeHectares: z.number().nonnegative().max(10_000_000).nullish(),
  capacity: z.number().int().positive().max(1_000_000).nullish(),
});

export const createFarm = asyncHandler(async (req, res) => {
  if (req.user.farmId) {
    throw new HttpError(409, "You already have an active farm");
  }

  const data = farmSchema.parse(req.body);

  const farm = await prisma.farm.create({
    data: { ...data, ownerId: req.user.id },
  });
  await prisma.user.update({
    where: { id: req.user.id },
    data: { farmId: farm.id },
  });

  res.status(201).json(farm);
});

export const getMyFarm = asyncHandler(async (req, res) => {
  await requireFarm(req.user);

  const farm = await prisma.farm.findUnique({
    where: { id: req.user.farmId },
    include: {
      _count: { select: { cattle: true, inventoryItems: true, alerts: true } },
    },
  });

  res.json(farm);
});

export const updateMyFarm = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  if (!canManageFarm(req.user, farm)) {
    throw new HttpError(403, "Only the farm owner can update farm details");
  }

  const data = farmSchema.partial().parse(req.body);
  if (Object.keys(data).length === 0) {
    throw new HttpError(422, "No changes provided");
  }

  const updated = await prisma.farm.update({
    where: { id: farm.id },
    data,
    include: {
      _count: { select: { cattle: true, inventoryItems: true, alerts: true } },
    },
  });

  res.json(updated);
});
