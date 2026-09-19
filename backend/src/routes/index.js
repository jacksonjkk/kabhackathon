import { Router } from "express";

import authRoutes from "./auth.routes.js";
import farmRoutes from "./farm.routes.js";
import cattleRoutes from "./cattle.routes.js";
import alertRoutes from "./alert.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import thermalRoutes from "./thermal.routes.js";
import observationRoutes from "./observation.routes.js";
import ussdRoutes from "./ussd.routes.js";
// ---------------------------------------------------------------------------
// REVISED BoviPulse scope: single core problem = delayed detection of abnormal
// cattle health patterns. Only health-monitoring routes are mounted.
// The modules below are parked as FUTURE ENHANCEMENTS (files kept, not mounted):
// - vaccination.routes.js (VaxiTrack)
// - inventory.routes.js  (Inventory management)
// - muzzle.routes.js     (MuzzleID biometric ID)
// - gesta.routes.js      (GestaCheck reproduction)
// Uncomment to re-enable after the core is evaluated.
// ---------------------------------------------------------------------------
// import vaccinationRoutes from "./vaccination.routes.js";
// import inventoryRoutes from "./inventory.routes.js";
// import muzzleRoutes from "./muzzle.routes.js";
// import gestaRoutes from "./gesta.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/farms", farmRoutes);
// Module 1 — Animal & Sensor Registration (minimal identity for monitoring)
router.use("/cattle", cattleRoutes);
// Module 2/4 — IoT Monitoring + ML predictions (ThermaGuard core)
router.use("/thermaguard", thermalRoutes);
// Module 5 — Early Warning & Alerts (health only)
router.use("/alerts", alertRoutes);
// Module 6 — Monitoring overview (health trends only)
router.use("/analytics", analyticsRoutes);
// Supporting — human follow-up notes on alerts
router.use("/observations", observationRoutes);
// Basic-phone caretakers (Africa's Talking USSD; public, phone-matched)
router.use("/ussd", ussdRoutes);

export default router;
