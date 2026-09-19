import { Router } from "express";
import {
  registerMuzzleProfile,
  identifyMuzzle,
  listMuzzleProfiles,
  deleteMuzzleProfile,
} from "../controllers/muzzle.controller.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(authenticate);

router.post("/register", upload.single("image"), registerMuzzleProfile);
router.post("/identify", upload.single("image"), identifyMuzzle);
router.get("/profiles", listMuzzleProfiles);
router.delete("/profiles/:id", deleteMuzzleProfile);

export default router;
