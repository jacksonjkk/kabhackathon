-- AlterTable
ALTER TABLE "User" ADD COLUMN     "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "monitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trendsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "units" TEXT NOT NULL DEFAULT 'metric';

