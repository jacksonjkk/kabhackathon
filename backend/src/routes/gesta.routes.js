import { Router } from "express";
import {
  createExam,
  listExams,
  predictPregnancy,
} from "../controllers/gesta.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/exams", listExams);
router.post("/exams", createExam);
router.post("/predict", predictPregnancy);

export default router;
