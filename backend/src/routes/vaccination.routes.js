import { Router } from "express";
import {
  createVaccination,
  listVaccinations,
  updateVaccination,
  deleteVaccination,
} from "../controllers/vaccination.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", listVaccinations);
router.post("/", createVaccination);
router.patch("/:id", updateVaccination);
router.delete("/:id", deleteVaccination);

export default router;
