import { prisma } from "../lib/prisma.js";

export const createAlert = ({ farmId, cattleId = null, type, source = "THRESHOLD", severity = "LOW", title, message, predictionId = null }) =>
  prisma.alert.create({
    data: { farmId, cattleId, type, source, severity, title, message, predictionId },
  });

export const SEVERITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
