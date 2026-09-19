import { Router } from "express";
import {
  createReading,
  createPrediction,
  listPredictions,
  listReadings,
  getSummary,
} from "../controllers/thermal.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/readings", listReadings);
router.post("/readings", createReading);
// External ML model (trained outside the backend) submits inference here.
router.post("/predictions", createPrediction);
router.get("/predictions", listPredictions);
router.get("/summary", getSummary);

export default router;
