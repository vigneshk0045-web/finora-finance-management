import express from "express";
import { getOverview } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/overview", getOverview);
export default router;
