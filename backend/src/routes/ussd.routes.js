import { Router } from "express";
import express from "express";
import { ussdCallback, ussdHealth } from "../controllers/ussd.controller.js";

const router = Router();

// Africa's Talking posts x-www-form-urlencoded, not JSON.
router.use(express.urlencoded({ extended: false }));

router.post("/callback", ussdCallback);
router.get("/callback", ussdHealth);

export default router;
