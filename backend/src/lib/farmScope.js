import { prisma } from "./prisma.js";
import { HttpError } from "./httpError.js";

export async function requireFarm(user) {
  if (!user.farmId) {
    throw new HttpError(400, "Create your farm first before accessing this resource");
  }
  const farm = await prisma.farm.findUnique({ where: { id: user.farmId } });
  if (!farm) {
    throw new HttpError(404, "Linked farm no longer exists");
  }
  return farm;
}

export function canManageFarm(user, farm) {
  return user.role === "ADMIN" || farm.ownerId === user.id;
}
