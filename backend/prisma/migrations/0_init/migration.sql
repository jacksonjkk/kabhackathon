-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FARMER',
    "phone" TEXT,
    "farmId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "sizeHectares" DOUBLE PRECISION,
    "capacity" INTEGER,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cattle" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT,
    "breed" TEXT,
    "gender" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "weightKg" DOUBLE PRECISION,
    "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "pregnancyStatus" TEXT,
    "lactationStage" TEXT,
    "photoUrl" TEXT,
    "notes" TEXT,
    "farmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "doseDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "vetName" TEXT,
    "batchNumber" TEXT,
    "notes" TEXT,
    "cattleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'units',
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "farmId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'THRESHOLD',
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "farmId" TEXT NOT NULL,
    "cattleId" TEXT,
    "predictionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThermalReading" (
    "id" TEXT NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "ambientC" DOUBLE PRECISION,
    "activityLevel" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "deviceId" TEXT,
    "anomaly" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "prediction" TEXT,
    "anomalyScore" DOUBLE PRECISION,
    "modelVersion" TEXT,
    "imageUrl" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cattleId" TEXT NOT NULL,

    CONSTRAINT "ThermalReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "cattleId" TEXT NOT NULL,
    "readingId" TEXT,
    "label" TEXT NOT NULL,
    "anomalyScore" DOUBLE PRECISION,
    "reason" TEXT,
    "modelVersion" TEXT NOT NULL DEFAULT 'external-v1',
    "featuresJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "cattleId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "action" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GestaCheck" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "daysSinceBreeding" INTEGER,
    "examDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "cattleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GestaCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuzzleProfile" (
    "id" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "cattleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuzzleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Farm_ownerId_key" ON "Farm"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Cattle_tagNumber_key" ON "Cattle"("tagNumber");

-- CreateIndex
CREATE INDEX "Vaccination_cattleId_idx" ON "Vaccination"("cattleId");

-- CreateIndex
CREATE INDEX "Vaccination_nextDueDate_idx" ON "Vaccination"("nextDueDate");

-- CreateIndex
CREATE INDEX "InventoryItem_farmId_idx" ON "InventoryItem"("farmId");

-- CreateIndex
CREATE INDEX "Alert_farmId_isRead_idx" ON "Alert"("farmId", "isRead");

-- CreateIndex
CREATE INDEX "Alert_cattleId_createdAt_idx" ON "Alert"("cattleId", "createdAt");

-- CreateIndex
CREATE INDEX "ThermalReading_cattleId_capturedAt_idx" ON "ThermalReading"("cattleId", "capturedAt");

-- CreateIndex
CREATE INDEX "Prediction_cattleId_createdAt_idx" ON "Prediction"("cattleId", "createdAt");

-- CreateIndex
CREATE INDEX "Observation_cattleId_createdAt_idx" ON "Observation"("cattleId", "createdAt");

-- CreateIndex
CREATE INDEX "GestaCheck_cattleId_idx" ON "GestaCheck"("cattleId");

-- CreateIndex
CREATE UNIQUE INDEX "MuzzleProfile_imageHash_key" ON "MuzzleProfile"("imageHash");

-- CreateIndex
CREATE INDEX "MuzzleProfile_cattleId_idx" ON "MuzzleProfile"("cattleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cattle" ADD CONSTRAINT "Cattle_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThermalReading" ADD CONSTRAINT "ThermalReading_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "ThermalReading"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GestaCheck" ADD CONSTRAINT "GestaCheck_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuzzleProfile" ADD CONSTRAINT "MuzzleProfile_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

