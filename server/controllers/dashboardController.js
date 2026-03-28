import Wallet from "../models/Wallet.js";
import Expense from "../models/Expense.js";
import Investment from "../models/Investment.js";
import InvestmentGoal from "../models/InvestmentGoal.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

const fmt = (n) => Number((n || 0).toFixed(2));
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1);

export const getOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const wallet = await Wallet.findOne({ user: userId });
    const expenses = await Expense.find({ user: userId, occurredAt: { $gte: startOfMonth(now), $lt: endOfMonth(now) } });
    const investments = await Investment.find({ user: userId });
    const goals = await InvestmentGoal.find({ user: userId });
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(5).populate("counterpartUser", "name email");
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(5);

    const expenseTotal = fmt(expenses.reduce((s, x) => s + x.amount, 0));
    const investedAmount = fmt(investments.reduce((s, x) => s + x.units * x.buyPrice, 0));
    const currentValue = fmt(investments.reduce((s, x) => s + x.units * x.currentPrice, 0));
    const netWorth = fmt((wallet?.balance || 0) + currentValue);
    const goalsProgress = goals.map((g) => ({
      _id: g._id,
      title: g.title,
      progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
    }));

    res.json({
      cards: {
        walletBalance: fmt(wallet?.balance || 0),
        monthlyExpenses: expenseTotal,
        totalInvested: investedAmount,
        portfolioValue: currentValue,
        netWorth,
        activeGoals: goals.length,
      },
      transactions,
      notifications,
      goalsProgress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
