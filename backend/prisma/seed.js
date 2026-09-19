import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(currentDir, "..", "uploads");

const DAY_MS = 86_400_000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);
const daysAhead = (days) => new Date(Date.now() + days * DAY_MS);
const hoursAgo = (hours) => new Date(Date.now() - hours * 3_600_000);
const yearsAgo = (years) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
};

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function main() {
  await prisma.muzzleProfile.deleteMany();
  await prisma.thermalReading.deleteMany();
  await prisma.gestaCheck.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.cattle.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Farmer#123", 10);
  const owner = await prisma.user.create({
    data: {
      name: "Mwansa Chirwa",
      email: "farmer@bovipulse.ai",
      passwordHash,
      role: "FARMER",
      phone: "+260 97 000 0000",
    },
  });

  const farm = await prisma.farm.create({
    data: {
      name: "Green Pastures Dairy",
      location: "Chilanga District, Lusaka Province",
      sizeHectares: 42.5,
      capacity: 120,
      ownerId: owner.id,
    },
  });
  await prisma.user.update({
    where: { id: owner.id },
    data: { farmId: farm.id },
  });

  const cattleData = [
    { tagNumber: "BP-001", name: "Daisy", breed: "Holstein Friesian", gender: "FEMALE", birthDate: yearsAgo(4), weightKg: 620, healthStatus: "HEALTHY", pregnancyStatus: "OPEN", lactationStage: "Early" },
    { tagNumber: "BP-002", name: "Bella", breed: "Holstein Friesian", gender: "FEMALE", birthDate: yearsAgo(3), weightKg: 580, healthStatus: "HEALTHY", pregnancyStatus: "PREGNANT", lactationStage: "Mid" },
    { tagNumber: "BP-003", name: "Molly", breed: "Jersey", gender: "FEMALE", birthDate: yearsAgo(5), weightKg: 490, healthStatus: "SICK", pregnancyStatus: "OPEN", lactationStage: "Late" },
    { tagNumber: "BP-004", name: "Luna", breed: "Holstein Friesian", gender: "FEMALE", birthDate: yearsAgo(2), weightKg: 540, healthStatus: "UNDER_TREATMENT", pregnancyStatus: "OPEN", lactationStage: null },
    { tagNumber: "BP-005", name: "Stella", breed: "Ayrshire", gender: "FEMALE", birthDate: yearsAgo(6), weightKg: 610, healthStatus: "HEALTHY", pregnancyStatus: "CHECK_REQUIRED", lactationStage: "Early" },
    { tagNumber: "BP-006", name: "Bessie", breed: "Brown Swiss", gender: "FEMALE", birthDate: yearsAgo(4), weightKg: 600, healthStatus: "HEALTHY", pregnancyStatus: "PREGNANT", lactationStage: "Late" },
    { tagNumber: "BP-007", name: "Clover", breed: "Holstein Friesian", gender: "MALE", birthDate: yearsAgo(3), weightKg: 700, healthStatus: "HEALTHY", pregnancyStatus: null, lactationStage: null },
    { tagNumber: "BP-008", name: "Rosie", breed: "Jersey", gender: "FEMALE", birthDate: yearsAgo(5), weightKg: 640, healthStatus: "QUARANTINED", pregnancyStatus: "OPEN", lactationStage: "Mid" },
  ];

  const cows = {};
  for (const cow of cattleData) {
    cows[cow.tagNumber] = await prisma.cattle.create({
      data: { ...cow, farmId: farm.id },
    });
  }

  await prisma.vaccination.createMany({
    data: [
      { cattleId: cows["BP-001"].id, vaccineName: "Foot and Mouth Disease (FMD)", doseDate: daysAgo(60), nextDueDate: daysAhead(305), status: "COMPLETED", vetName: "Dr. Banda", batchNumber: "FMD-2025-A19" },
      { cattleId: cows["BP-002"].id, vaccineName: "Lumpy Skin Disease", doseDate: daysAgo(180), nextDueDate: daysAhead(185), status: "COMPLETED", vetName: "Dr. Banda", batchNumber: "LSD-2025-077" },
      { cattleId: cows["BP-003"].id, vaccineName: "Lumpy Skin Disease", doseDate: daysAgo(175), nextDueDate: daysAgo(2), status: "OVERDUE", vetName: "Dr. Phiri", batchNumber: "LSD-2025-077" },
      { cattleId: cows["BP-004"].id, vaccineName: "Deworming (Albendazole)", doseDate: daysAgo(5), nextDueDate: daysAhead(85), status: "SCHEDULED", vetName: "Dr. Phiri" },
      { cattleId: cows["BP-006"].id, vaccineName: "Brucellosis (S19)", doseDate: daysAgo(300), nextDueDate: daysAhead(65), status: "SCHEDULED", vetName: "Dr. Banda" },
      { cattleId: cows["BP-005"].id, vaccineName: "Black Quarter (BQ)", doseDate: daysAgo(353), nextDueDate: daysAhead(12), status: "SCHEDULED", vetName: "Dr. Banda" },
    ],
  });

  await prisma.inventoryItem.createMany({
    data: [
      { farmId: farm.id, name: "FMD Vaccine", category: "VACCINE", quantity: 8, unit: "vials", reorderLevel: 10, supplier: "VetCo Supplies" },
      { farmId: farm.id, name: "Penicillin", category: "MEDICINE", quantity: 0, unit: "bottles", reorderLevel: 5, supplier: "AgriMed Ltd" },
      { farmId: farm.id, name: "Mineral Supplement", category: "SUPPLEMENT", quantity: 45, unit: "kg", reorderLevel: 15, supplier: "Zambeef Feed" },
      { farmId: farm.id, name: "Acaricide (Tick Control)", category: "MEDICINE", quantity: 18, unit: "litres", reorderLevel: 6, supplier: "VetCo Supplies" },
      { farmId: farm.id, name: "Dairy Meal", category: "FEED", quantity: 60, unit: "bags", reorderLevel: 20, supplier: "Nova Feed Mill" },
      { farmId: farm.id, name: "Disposable Syringes", category: "EQUIPMENT", quantity: 210, unit: "pcs", reorderLevel: 50, supplier: "AgriMed Ltd" },
    ],
  });

  await prisma.alert.createMany({
    data: [
      { farmId: farm.id, cattleId: cows["BP-003"].id, type: "HEALTH", severity: "CRITICAL", title: "Critical fever detected · BP-003", message: "Molly recorded a body temperature of 40.1°C.", createdAt: daysAgo(1) },
      { farmId: farm.id, cattleId: cows["BP-003"].id, type: "VACCINATION", severity: "HIGH", title: "Overdue vaccination · BP-003", message: "Lumpy Skin Disease booster for Molly was due 2 days ago.", createdAt: daysAgo(2) },
      { farmId: farm.id, type: "INVENTORY", severity: "HIGH", title: "Penicillin is out of stock", message: "Current stock: 0 bottles (reorder level: 5).", createdAt: hoursAgo(21) },
      { farmId: farm.id, type: "INVENTORY", severity: "MEDIUM", title: "FMD Vaccine is running low", message: "Current stock: 8 vials (reorder level: 10).", createdAt: hoursAgo(3) },
      { farmId: farm.id, type: "SYSTEM", severity: "LOW", title: "Welcome to BoviPulse AI", message: "Your farm has been registered successfully.", isRead: true, createdAt: daysAgo(10) },
    ],
  });

  const thermalRows = [];
  const mollyTemps = [
    { offset: 6, temp: 38.7 }, { offset: 5, temp: 38.9 },
    { offset: 4, temp: 39.1 }, { offset: 3, temp: 39.4 },
    { offset: 2, temp: 39.7 }, { offset: 1, temp: 40.1 },
  ];
  for (const { offset, temp } of mollyTemps) {
    const feverThreshold = 39.5;
    thermalRows.push({
      cattleId: cows["BP-003"].id,
      temperatureC: temp,
      ambientC: 24,
      capturedAt: daysAgo(offset),
      anomaly: temp >= feverThreshold || temp < 37,
      riskLevel: temp >= 40.3 ? "CRITICAL" : temp >= feverThreshold ? "HIGH" : "LOW",
    });
  }
  thermalRows.push(
    { cattleId: cows["BP-001"].id, temperatureC: 38.5, ambientC: 23, capturedAt: daysAgo(1) },
    { cattleId: cows["BP-002"].id, temperatureC: 38.4, ambientC: 23, capturedAt: daysAgo(1) },
    { cattleId: cows["BP-006"].id, temperatureC: 38.6, ambientC: 22, capturedAt: daysAgo(2) },
    { cattleId: cows["BP-008"].id, temperatureC: 38.9, ambientC: 25, capturedAt: daysAgo(2) }
  );
  for (const row of thermalRows) {
    if (row.riskLevel == null) row.riskLevel = "LOW";
    await prisma.thermalReading.create({ data: row });
  }

  await prisma.gestaCheck.createMany({
    data: [
      { cattleId: cows["BP-002"].id, method: "ULTRASOUND", result: "PREGNANT", confidence: 0.96, daysSinceBreeding: 95, examDate: daysAgo(30), notes: "Healthy foetus, expected calving in ~250 days." },
      { cattleId: cows["BP-006"].id, method: "VETERINARY_EXAM", result: "PREGNANT", confidence: 0.92, daysSinceBreeding: 160, examDate: daysAgo(45) },
      { cattleId: cows["BP-005"].id, method: "AI_PREDICTION", result: "INCONCLUSIVE", confidence: 0.48, daysSinceBreeding: 28, examDate: daysAgo(7), notes: "Signs ambiguous, recheck recommended." },
    ],
  });

  const muzzleFile = path.join(uploadsDir, "seed-muzzle-bp-001.png");
  writeFileSync(muzzleFile, TINY_PNG);
  await prisma.muzzleProfile.create({
    data: {
      cattleId: cows["BP-001"].id,
      imagePath: "/uploads/seed-muzzle-bp-001.png",
      imageHash: createHash("sha256").update(TINY_PNG).digest("hex"),
    },
  });

  console.log("Seed complete.");
  console.log("Login with: farmer@bovipulse.ai / Farmer#123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
