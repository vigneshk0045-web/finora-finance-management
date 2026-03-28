import express from "express";
import { createExpense, deleteExpense, getAllExpenses, getBudget, getCategoryBreakdown, getMonthlySpendSeries, getMonthlySummary, getRecentExpenses, setBudget, updateExpense } from "../controllers/expensesController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/", getAllExpenses);
router.get("/summary", getMonthlySummary);
router.get("/monthly", getMonthlySpendSeries);
router.get("/categories", getCategoryBreakdown);
router.get("/recent", getRecentExpenses);
router.get("/budget", getBudget);
router.put("/budget", setBudget);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);
export default router;
