import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm } from "../lib/farmScope.js";
import { sha256File } from "../lib/hash.js";
import { uploadsRoot } from "../middleware/upload.js";

async function removeUploadedFile(file) {
  if (!file?.path) return;
  await fs.unlink(file.path).catch(() => {});
}

export const registerMuzzleProfile = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const file = req.file;
  if (!file) throw new HttpError(400, "A muzzle image file is required");

  try {
    const schema = z.object({ cattleId: z.string().min(1) });
    const { cattleId } = schema.parse(req.body);

    const cattle = await prisma.cattle.findFirst({
      where: { id: cattleId, farmId: farm.id },
    });
    if (!cattle) throw new HttpError(404, "Cattle not found in your farm");

    const imageHash = sha256File(file.path);
    const existing = await prisma.muzzleProfile.findUnique({ where: { imageHash } });
    if (existing) {
      throw new HttpError(409, "This muzzle image is already registered");
    }

    const profile = await prisma.muzzleProfile.create({
      data: {
        cattleId: cattle.id,
        imagePath: `/uploads/${file.filename}`,
        imageHash,
      },
      include: {
        cattle: { select: { id: true, tagNumber: true, name: true, breed: true } },
      },
    });

    res.status(201).json(profile);
  } catch (error) {
    await removeUploadedFile(file);
    throw error;
  }
});

export const identifyMuzzle = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const file = req.file;
  if (!file) throw new HttpError(400, "A muzzle image file is required");

  try {
    const imageHash = sha256File(file.path);
    const profile = await prisma.muzzleProfile.findUnique({
      where: { imageHash },
      include: {
        cattle: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
            breed: true,
            gender: true,
            birthDate: true,
            weightKg: true,
            healthStatus: true,
            pregnancyStatus: true,
            photoUrl: true,
            farmId: true,
          },
        },
      },
    });

    if (!profile || profile.cattle.farmId !== farm.id) {
      return res.json({
        matched: false,
        message: "No registered muzzle matches this image",
      });
    }

    const cattle = profile.cattle;
    res.json({
      matched: true,
      similarity: 1,
      profileId: profile.id,
      registeredAt: profile.createdAt,
      cattle,
    });
  } finally {
    await removeUploadedFile(file);
  }
});

export const listMuzzleProfiles = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const where = { cattle: { farmId: farm.id } };
  if (typeof req.query.cattleId === "string" && req.query.cattleId) {
    where.cattleId = req.query.cattleId;
  }

  const profiles = await prisma.muzzleProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      cattle: { select: { id: true, tagNumber: true, name: true, breed: true } },
    },
  });

  res.json({ data: profiles, total: profiles.length });
});

export const deleteMuzzleProfile = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const profile = await prisma.muzzleProfile.findFirst({
    where: { id: req.params.id, cattle: { farmId: farm.id } },
  });
  if (!profile) throw new HttpError(404, "Muzzle profile not found");

  const relativePath = path.basename(profile.imagePath);
  await fs.unlink(path.join(uploadsRoot, relativePath)).catch(() => {});

  await prisma.muzzleProfile.delete({ where: { id: profile.id } });

  res.status(204).send();
});
