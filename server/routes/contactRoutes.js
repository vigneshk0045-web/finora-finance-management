import express from "express";
import { submitContact } from "../controllers/contactController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", submitContact);
router.post("/secure", requireAuth, submitContact);
export default router;
