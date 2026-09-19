import multer from "multer";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { HttpError } from "../lib/httpError.js";
import { env, projectRoot } from "../config/env.js";

const uploadsDir = path.resolve(projectRoot, env.uploadDir);
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname ?? "").toLowerCase();
    const ext = ALLOWED_EXT.has(rawExt) ? rawExt : ".bin";
    cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new HttpError(415, "Only JPEG, PNG, or WebP images are allowed"));
    }
    cb(null, true);
  },
});

export const uploadsRoot = uploadsDir;
export const toPublicPath = (filename) => `/uploads/${filename}`;
