import express from "express";
import { createGoal, createInvestment, deleteGoal, deleteInvestment, getAllocation, getGoals, getHoldings, getInsights, getInvestmentSummary, getPerformance, updateGoal, updateInvestment } from "../controllers/investmentsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/summary", getInvestmentSummary);
router.get("/allocation", getAllocation);
router.get("/performance", getPerformance);
router.get("/holdings", getHoldings);
router.get("/insights", getInsights);
router.get("/goals", getGoals);
router.post("/", createInvestment);
router.put("/:id", updateInvestment);
router.delete("/:id", deleteInvestment);
router.post("/goals", createGoal);
router.put("/goals/:id", updateGoal);
router.delete("/goals/:id", deleteGoal);
export default router;
