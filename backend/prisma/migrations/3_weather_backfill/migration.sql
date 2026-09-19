-- AlterTable
ALTER TABLE "Farm" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ThermalReading" ADD COLUMN     "ambientSource" TEXT,
ADD COLUMN     "humiditySource" TEXT;
