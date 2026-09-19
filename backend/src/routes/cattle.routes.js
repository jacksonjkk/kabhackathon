import { Router } from "express";
import {
  listCattle,
  createCattle,
  getCattle,
  updateCattle,
  deleteCattle,
} from "../controllers/cattle.controller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", listCattle);
router.post("/", createCattle);
router.get("/:id", getCattle);
router.patch("/:id", updateCattle);
router.delete("/:id", requireRole("FARMER", "ADMIN"), deleteCattle);

export default router;
