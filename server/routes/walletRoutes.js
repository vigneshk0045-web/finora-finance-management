import express from "express";
import { getBalance, getTransactions, topUp, transferMoney } from "../controllers/walletController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/balance", getBalance);
router.get("/transactions", getTransactions);
router.post("/topup", topUp);
router.post("/transfer", transferMoney);
export default router;
