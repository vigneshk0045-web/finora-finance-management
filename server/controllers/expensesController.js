import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Budget from "../models/Budget.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1);
const fmt = (n) => Number((n || 0).toFixed(2));
const currentUserId = (req) => req.user?._id || req.params.userId;

const computeMonthlySummary = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const totalAgg = await Expense.aggregate([
    { $match: { user: uid, occurredAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const total = totalAgg?.[0]?.total ?? 0;
  const budget = await Budget.findOne({ user: userId, year: now.getFullYear(), month: now.getMonth() + 1 });
  const limit = budget?.limit ?? 12000;
  const remaining = fmt(limit - total);
  const overBy = Math.max(0, fmt(total - limit));
  const status = total <= limit ? "On Track" : "Over Budget";

  return { total: fmt(total), limit, remaining, overBy, status, month: now.getMonth() + 1, year: now.getFullYear() };
};

export const getAllExpenses = async (req, res) => {
  try {
    const rows = await Expense.find({ user: currentUserId(req) }).sort({ occurredAt: -1 });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const summary = await computeMonthlySummary(currentUserId(req));
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMonthlySpendSeries = async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(currentUserId(req));
    const months = Math.min(Math.max(Number(req.query.months || 6), 3), 12);
    const now = new Date();
    const windows = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      windows.push({ from: startOfMonth(d), to: endOfMonth(d), year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    const agg = await Expense.aggregate([
      { $match: { user: uid, occurredAt: { $gte: windows[0].from, $lt: windows[windows.length - 1].to } } },
      { $group: { _id: { y: { $year: "$occurredAt" }, m: { $month: "$occurredAt" } }, total: { $sum: "$amount" } } },
    ]);
    const byKey = new Map(agg.map((r) => [`${r._id.y}-${r._id.m}`, r.total]));
    res.json(windows.map((w) => ({ label: new Date(w.year, w.month - 1, 1).toLocaleString(undefined, { month: "short" }), total: fmt(byKey.get(`${w.year}-${w.month}`) || 0) })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(currentUserId(req));
    const now = new Date();
    const agg = await Expense.aggregate([
      { $match: { user: uid, occurredAt: { $gte: startOfMonth(now), $lt: endOfMonth(now) } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);
    const budget = await Budget.findOne({ user: currentUserId(req), year: now.getFullYear(), month: now.getMonth() + 1 });
    const limit = budget?.limit ?? 12000;
    res.json({
      limit,
      data: agg.map((r) => ({ category: r._id, total: fmt(r.total), pctOfBudget: limit > 0 ? Math.round((r.total / limit) * 100) : 0 })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentExpenses = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 6), 1), 20);
    const items = await Expense.find({ user: currentUserId(req) }).sort({ occurredAt: -1 }).limit(limit);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const userId = currentUserId(req);
    const { title, merchant, category, amount, occurredAt, recurring } = req.body;
    if (!title || !category || amount === undefined) return res.status(400).json({ message: "title, category, amount required" });

    const amt = Number(amount);
    const when = occurredAt ? new Date(occurredAt) : new Date();
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    wallet.balance = fmt(wallet.balance - amt);
    await wallet.save();

    const tx = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: "expense",
      amount: amt,
      category,
      description: `${title}${merchant ? ` · ${merchant}` : ""}`,
    });
    const expense = await Expense.create({ user: userId, title, merchant: merchant || "", category, amount: amt, occurredAt: when, recurring: !!recurring, walletTransaction: tx._id });
    const summary = await computeMonthlySummary(userId);
    if (summary.status === "Over Budget") {
      await Notification.create({ user: userId, title: "Budget alert", message: `You are over budget by ₹${summary.overBy.toLocaleString()}.`, type: "warning" });
    }
    res.status(201).json({ expense, walletBalance: wallet.balance, summary, overBudget: summary.status === "Over Budget", overBy: summary.overBy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const userId = currentUserId(req);
    const expense = await Expense.findOne({ _id: req.params.id, user: userId });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const oldAmount = Number(expense.amount || 0);
    const nextAmount = req.body.amount !== undefined ? Number(req.body.amount) : oldAmount;
    if (!Number.isFinite(nextAmount) || nextAmount < 0) return res.status(400).json({ message: "amount must be a positive number" });

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const delta = fmt(nextAmount - oldAmount);
    if (delta > 0 && wallet.balance < delta) {
      return res.status(400).json({ message: "Insufficient wallet balance for this edit" });
    }

    wallet.balance = fmt(wallet.balance - delta);
    await wallet.save();

    expense.title = req.body.title ?? expense.title;
    expense.merchant = req.body.merchant ?? expense.merchant;
    expense.category = req.body.category ?? expense.category;
    expense.amount = nextAmount;
    expense.occurredAt = req.body.occurredAt ? new Date(req.body.occurredAt) : expense.occurredAt;
    if (req.body.recurring !== undefined) expense.recurring = !!req.body.recurring;
    await expense.save();

    if (expense.walletTransaction) {
      await Transaction.findByIdAndUpdate(expense.walletTransaction, {
        $set: {
          amount: nextAmount,
          category: expense.category,
          description: `${expense.title}${expense.merchant ? ` · ${expense.merchant}` : ""}`,
        },
      });
    }

    await Notification.create({
      user: userId,
      title: "Expense updated",
      message: `${expense.title} was updated to ₹${nextAmount.toLocaleString()}.`,
      type: "info",
    });

    const summary = await computeMonthlySummary(userId);
    res.json({ expense, walletBalance: wallet.balance, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const userId = currentUserId(req);
    const expense = await Expense.findOne({ _id: req.params.id, user: userId });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    wallet.balance = fmt(wallet.balance + Number(expense.amount || 0));
    await wallet.save();

    if (expense.walletTransaction) {
      await Transaction.findByIdAndDelete(expense.walletTransaction);
    }
    await Expense.deleteOne({ _id: expense._id });
    await Notification.create({
      user: userId,
      title: "Expense deleted",
      message: `${expense.title} was removed and ₹${Number(expense.amount || 0).toLocaleString()} was restored to your wallet.`,
      type: "info",
    });
    const summary = await computeMonthlySummary(userId);
    res.json({ message: "Expense deleted", walletBalance: wallet.balance, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBudget = async (req, res) => {
  try {
    const now = new Date();
    const b = await Budget.findOne({ user: currentUserId(req), year: now.getFullYear(), month: now.getMonth() + 1 });
    res.json({ year: now.getFullYear(), month: now.getMonth() + 1, limit: b?.limit ?? 12000 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setBudget = async (req, res) => {
  try {
    const lim = Number(req.body.limit);
    if (!Number.isFinite(lim) || lim <= 0) return res.status(400).json({ message: "limit must be a positive number" });
    const now = new Date();
    const b = await Budget.findOneAndUpdate(
      { user: currentUserId(req), year: now.getFullYear(), month: now.getMonth() + 1 },
      { $set: { limit: lim } },
      { new: true, upsert: true }
    );
    const summary = await computeMonthlySummary(currentUserId(req));
    res.json({ budget: { year: b.year, month: b.month, limit: b.limit }, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
