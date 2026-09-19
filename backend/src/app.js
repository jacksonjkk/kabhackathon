import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import rateLimit from "express-rate-limit";

import { env, projectRoot } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { uploadsRoot } from "./middleware/upload.js";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.use(
  "/uploads",
  express.static(uploadsRoot ?? path.resolve(projectRoot, env.uploadDir), {
    maxAge: "7d",
  })
);

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "bovipulse-api",
    environment: env.nodeEnv,
    time: new Date().toISOString(),
  });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);
