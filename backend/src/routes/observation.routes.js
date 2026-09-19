import { Router } from "express";
import { listObservations, createObservation } from "../controllers/observation.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", listObservations);
router.post("/", createObservation);

export default router;
