import { Router } from "express";
import {
  listAlerts,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
} from "../controllers/alert.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", listAlerts);
router.patch("/read-all", markAllAlertsRead);
router.patch("/:id/read", markAlertRead);
router.delete("/:id", deleteAlert);

export default router;
