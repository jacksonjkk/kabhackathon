import { Router } from "express";
import {
  createInventoryItem,
  listInventoryItems,
  updateInventoryItem,
  deleteInventoryItem,
} from "../controllers/inventory.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", listInventoryItems);
router.post("/", createInventoryItem);
router.patch("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

export default router;
