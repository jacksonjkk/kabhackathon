-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "predictionId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'THRESHOLD';

-- AlterTable
ALTER TABLE "ThermalReading" ADD COLUMN     "activityLevel" DOUBLE PRECISION,
ADD COLUMN     "anomalyScore" DOUBLE PRECISION,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "humidity" DOUBLE PRECISION,
ADD COLUMN     "modelVersion" TEXT,
ADD COLUMN     "prediction" TEXT;

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

-- CreateIndex
CREATE INDEX "Prediction_cattleId_createdAt_idx" ON "Prediction"("cattleId", "createdAt");

-- CreateIndex
CREATE INDEX "Observation_cattleId_createdAt_idx" ON "Observation"("cattleId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_cattleId_createdAt_idx" ON "Alert"("cattleId", "createdAt");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "ThermalReading"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_cattleId_fkey" FOREIGN KEY ("cattleId") REFERENCES "Cattle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

