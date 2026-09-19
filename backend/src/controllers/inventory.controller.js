import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler.js";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { requireFarm } from "../lib/farmScope.js";
import { getPagination, paginated } from "../lib/pagination.js";
import { createAlert } from "../services/alert.service.js";

const inventorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(["FEED", "MEDICINE", "VACCINE", "EQUIPMENT", "SUPPLEMENT", "OTHER"]),
  quantity: z.number().nonnegative().default(0),
  unit: z.string().trim().min(1).max(20).default("units"),
  reorderLevel: z.number().nonnegative().default(0),
  supplier: z.string().trim().max(120).nullish(),
});

function isLowStock(item) {
  return item.quantity <= item.reorderLevel;
}

async function raiseLowStockAlertIfNeeded(farmId, item) {
  if (!isLowStock(item)) return false;
  await createAlert({
    farmId,
    type: "INVENTORY",
    severity: item.quantity <= 0 ? "HIGH" : "MEDIUM",
    title: item.quantity <= 0 ? `${item.name} is out of stock` : `${item.name} is running low`,
    message: `Current stock: ${item.quantity} ${item.unit} (reorder level: ${item.reorderLevel}).`,
  });
  return true;
}

export const createInventoryItem = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const data = inventorySchema.parse(req.body);

  const item = await prisma.inventoryItem.create({
    data: { ...data, farmId: farm.id },
  });

  await raiseLowStockAlertIfNeeded(farm.id, item);

  res.status(201).json(item);
});

export const listInventoryItems = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);
  const { page, limit, skip, take } = getPagination(req.query);

  const where = { farmId: farm.id };
  const category = typeof req.query.category === "string" ? req.query.category.toUpperCase() : "";
  if (category) where.category = category;

  const [total, rows] = await Promise.all([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
    }),
  ]);

  let data = rows.map((item) => ({
    ...item,
    lowStock: isLowStock(item),
  }));

  if (String(req.query.lowOnly ?? "") === "true") {
    data = data.filter((item) => item.lowStock);
  }

  res.json(paginated(data, total, page, limit));
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const existing = await prisma.inventoryItem.findFirst({
    where: { id: req.params.id, farmId: farm.id },
  });
  if (!existing) throw new HttpError(404, "Inventory item not found");

  const data = inventorySchema.partial().parse(req.body);
  if (Object.keys(data).length === 0) {
    throw new HttpError(422, "No changes provided");
  }

  const item = await prisma.inventoryItem.update({
    where: { id: existing.id },
    data,
  });

  const crossedThreshold = !isLowStock(existing) && isLowStock(item);
  let alerted = false;
  if (crossedThreshold) {
    alerted = await raiseLowStockAlertIfNeeded(farm.id, item);
  }

  res.json({ ...item, lowStock: isLowStock(item), lowStockAlertRaised: alerted });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const farm = await requireFarm(req.user);

  const result = await prisma.inventoryItem.deleteMany({
    where: { id: req.params.id, farmId: farm.id },
  });
  if (result.count === 0) throw new HttpError(404, "Inventory item not found");

  res.status(204).send();
});
