import mongoose from "mongoose";
import Investment from "../models/Investment.js";
import InvestmentGoal from "../models/InvestmentGoal.js";
import PortfolioSnapshot from "../models/PortfolioSnapshot.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

const fmt = (n) => Number((n || 0).toFixed(2));
const currentUserId = (req) => req.user?._id || req.params.userId;

const getSummaryInternal = async (userId) => {
  const items = await Investment.find({ user: userId }).sort({ currentPrice: -1 });
  const totalInvested = fmt(items.reduce((sum, x) => sum + x.units * x.buyPrice, 0));
  const totalValue = fmt(items.reduce((sum, x) => sum + x.units * x.currentPrice, 0));
  const totalReturn = fmt(totalValue - totalInvested);
  const returnPct = totalInvested > 0 ? fmt((totalReturn / totalInvested) * 100) : 0;
  const todayChange = fmt(items.reduce((sum, x) => sum + x.units * x.currentPrice * ((x.dayChangePct || 0) / 100), 0));
  const dayChangePct = totalValue > 0 ? fmt((todayChange / totalValue) * 100) : 0;
  const monthlySip = fmt(items.reduce((sum, x) => sum + (x.monthlyContribution || 0), 0));
  return { totalInvested, totalValue, totalReturn, returnPct, todayChange, dayChangePct, holdingsCount: items.length, monthlySip };
};

export const getInvestmentSummary = async (req, res) => {
  try {
    res.json(await getSummaryInternal(currentUserId(req)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllocation = async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(currentUserId(req));
    const agg = await Investment.aggregate([
      { $match: { user: uid } },
      { $group: { _id: "$type", value: { $sum: { $multiply: ["$units", "$currentPrice"] } }, assets: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]);
    const total = agg.reduce((s, x) => s + x.value, 0);
    res.json(agg.map((x) => ({ type: x._id, value: fmt(x.value), pct: total > 0 ? Math.round((x.value / total) * 100) : 0, assets: x.assets })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPerformance = async (req, res) => {
  try {
    const months = Math.min(Math.max(Number(req.query.months || 6), 3), 12);
    const rows = await PortfolioSnapshot.find({ user: currentUserId(req) }).sort({ monthDate: -1 }).limit(months);
    res.json(rows.reverse().map((r) => ({ monthDate: r.monthDate, label: new Date(r.monthDate).toLocaleString(undefined, { month: "short" }), value: fmt(r.value) })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHoldings = async (req, res) => {
  try {
    const items = await Investment.find({ user: currentUserId(req) }).sort({ createdAt: -1 });
    res.json(items.map((x) => {
      const investedAmount = fmt(x.units * x.buyPrice);
      const currentValue = fmt(x.units * x.currentPrice);
      const pnl = fmt(currentValue - investedAmount);
      const pnlPct = investedAmount > 0 ? fmt((pnl / investedAmount) * 100) : 0;
      return { ...x.toJSON(), investedAmount, currentValue, pnl, pnlPct };
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInsights = async (req, res) => {
  try {
    const items = await Investment.find({ user: currentUserId(req) });
    const holdings = items.map((x) => {
      const investedAmount = fmt(x.units * x.buyPrice);
      const currentValue = fmt(x.units * x.currentPrice);
      const pnl = fmt(currentValue - investedAmount);
      return { name: x.name, type: x.type, currentValue, pnl };
    });
    const topGainer = holdings.slice().sort((a, b) => b.pnl - a.pnl)[0] || null;
    const topLoser = holdings.slice().sort((a, b) => a.pnl - b.pnl)[0] || null;
    const summary = await getSummaryInternal(currentUserId(req));
    const cryptoExposure = holdings.filter((x) => x.type === "Crypto").reduce((s, x) => s + x.currentValue, 0);
    const riskLevel = summary.totalValue > 0 && cryptoExposure / summary.totalValue > 0.35 ? "Aggressive" : summary.totalValue > 0 && cryptoExposure / summary.totalValue > 0.15 ? "Moderate" : "Balanced";
    const note = riskLevel === "Aggressive"
      ? "Your portfolio leans toward high-volatility assets. Consider balancing with safer allocations."
      : "Your portfolio shows a healthy allocation mix. Continue systematic investing for long-term growth.";
    res.json({ riskLevel, topGainer, topLoser, note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGoals = async (req, res) => {
  try {
    const rows = await InvestmentGoal.find({ user: currentUserId(req) }).sort({ targetDate: 1 });
    res.json(rows.map((g) => ({ ...g.toJSON(), progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0, remaining: fmt(g.targetAmount - g.currentAmount) })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createInvestment = async (req, res) => {
  try {
    const userId = currentUserId(req);
    const { name, symbol, type, units, buyPrice, currentPrice, dayChangePct, monthlyContribution, investedAt } = req.body;
    if (!name || !type || !units || !buyPrice || !currentPrice) return res.status(400).json({ message: "Missing required fields" });
    const cost = Number(units) * Number(buyPrice);
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (wallet.balance < cost) return res.status(400).json({ message: "Insufficient wallet balance" });
    wallet.balance = fmt(wallet.balance - cost);
    await wallet.save();
    const tx = await Transaction.create({ user: userId, wallet: wallet._id, type: "expense", amount: cost, category: "Investment", description: `Invested in ${name}` });
    const investment = await Investment.create({ user: userId, name, symbol, type, units: Number(units), buyPrice: Number(buyPrice), currentPrice: Number(currentPrice), dayChangePct: Number(dayChangePct || 0), monthlyContribution: Number(monthlyContribution || 0), investedAt: investedAt || new Date(), walletTransaction: tx._id });
    await Notification.create({ user: userId, title: "Investment added", message: `${name} was added to your portfolio and synced with your wallet.`, type: "success" });
    res.status(201).json({ investment, walletBalance: wallet.balance, summary: await getSummaryInternal(userId) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInvestment = async (req, res) => {
  try {
    const investment = await Investment.findOneAndUpdate({ _id: req.params.id, user: currentUserId(req) }, req.body, { new: true });
    if (!investment) return res.status(404).json({ message: "Investment not found" });
    res.json(investment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInvestment = async (req, res) => {
  try {
    const investment = await Investment.findOneAndDelete({ _id: req.params.id, user: currentUserId(req) });
    if (!investment) return res.status(404).json({ message: "Investment not found" });
    res.json({ message: "Investment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGoal = async (req, res) => {
  try {
    const userId = currentUserId(req);
    const { title, category, targetAmount, currentAmount, targetDate } = req.body;
    const goal = await InvestmentGoal.create({ user: userId, title, category, targetAmount: Number(targetAmount), currentAmount: Number(currentAmount || 0), targetDate });
    await Notification.create({ user: userId, title: "Goal created", message: `${title} is now being tracked in Finora.`, type: "info" });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await InvestmentGoal.findOneAndUpdate({ _id: req.params.id, user: currentUserId(req) }, req.body, { new: true });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await InvestmentGoal.findOneAndDelete({ _id: req.params.id, user: currentUserId(req) });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json({ message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
