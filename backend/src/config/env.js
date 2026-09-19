import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const toInt = (value, fallback) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
};

const toFloat = (value, fallback) => {
  const n = Number.parseFloat(value ?? "");
  return Number.isFinite(n) ? n : fallback;
};

export const projectRoot = path.resolve(currentDir, "..", "..");

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toInt(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET ?? "bovipulse-dev-secret-do-not-use-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxUploadMb: toInt(process.env.MAX_UPLOAD_MB, 5),
  feverThresholdC: toFloat(process.env.THERMAL_FEVER_THRESHOLD_C, 39.5),
  // Python inference service (serves ../models/*.pkl). Empty string disables
  // auto-scoring; readings then rely on threshold fallback until predictions
  // are submitted externally via POST /thermaguard/predictions.
  inferenceUrl: (process.env.INFERENCE_URL ?? "http://localhost:8000").trim(),
  // Reproductive guard (estrus/pregnancy confounders): re-labels alerts,
  // never suppresses them. ESTRUS_ACTIVITY_MIN = restlessness floor for an
  // estrus candidate; ESTRUS_TEMP_MAX = only sub-critical rises are
  // downgraded; CALVING_LOW_TEMP = pregnant + at/below this -> calving watch.
  reproGuardEnabled: (process.env.REPRO_GUARD_ENABLED ?? "true").toLowerCase() !== "false",
  estrusActivityMin: toFloat(process.env.ESTRUS_ACTIVITY_MIN, 60),
  estrusTempMax: toFloat(process.env.ESTRUS_TEMP_MAX, 40.3),
  calvingLowTemp: toFloat(process.env.CALVING_LOW_TEMP, 37.5),
  // Lameness screen active-hours gate (night rest must never flag).
  lamenessActiveStart: toFloat(process.env.LAMENESS_ACTIVE_START, 5),
  lamenessActiveEnd: toFloat(process.env.LAMENESS_ACTIVE_END, 20),
  // Location-aware weather backfill (Open-Meteo, no key). When a collar
  // reading arrives without ambientC/humidity, the backend fills the gap
  // from the farm's coordinates so the ML features (THI, heat_index) stay
  // meaningful instead of falling back to fixed defaults. WEATHER_ENABLED=false
  // disables all outbound weather calls (offline deployments).
  weatherEnabled: (process.env.WEATHER_ENABLED ?? "true").toLowerCase() !== "false",
  weatherCacheTtlMs: toInt(process.env.WEATHER_CACHE_TTL_S, 900) * 1000,
  weatherTimeoutMs: toInt(process.env.WEATHER_TIMEOUT_MS, 4000),
  // Africa's Talking (USSD callbacks need no key; outbound SMS does).
  // Sandbox delivers SMS only to registered test numbers.
  atUsername: process.env.AT_USERNAME ?? "sandbox",
  atApiKey: process.env.AT_API_KEY ?? "",
  atSmsFrom: process.env.AT_SMS_FROM ?? "",
  atSmsUrl:
    process.env.AT_SMS_URL ?? "https://api.sandbox.africastalking.com/version1",
};
