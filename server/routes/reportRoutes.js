import express from "express";
import { exportMonthlyCsv, exportMonthlyPdf, getMonthlyReport } from "../controllers/reportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/monthly", getMonthlyReport);
router.get("/export/csv", exportMonthlyCsv);
router.get("/export/pdf", exportMonthlyPdf);
export default router;
