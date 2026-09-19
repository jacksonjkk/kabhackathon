import { Router } from "express";
import { createFarm, getMyFarm, updateMyFarm } from "../controllers/farm.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/", authenticate, createFarm);
router.get("/me", authenticate, getMyFarm);
router.patch("/me", authenticate, updateMyFarm);

export default router;
