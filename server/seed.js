import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Wallet from "./models/Wallet.js";
import Transaction from "./models/Transaction.js";
import Expense from "./models/Expense.js";
import Budget from "./models/Budget.js";
import Investment from "./models/Investment.js";
import InvestmentGoal from "./models/InvestmentGoal.js";
import PortfolioSnapshot from "./models/PortfolioSnapshot.js";
import Notification from "./models/Notification.js";
import SupportMessage from "./models/SupportMessage.js";

dotenv.config();
await connectDB();

const namedUsers = [
  "Vignesh",
  "Sivaraj Kumar",
  "RajaVignesh",
  "Zaid Sharief",
  "Nanthini",
  "Hema",
  "Subashini",
  "Prasanna",
  "Inbathayal",
  "Raghul",
];

const fmt = (n) => Number((n || 0).toFixed(2));

const seed = async () => {
  try {
    await Promise.all([
      User.deleteMany(), Wallet.deleteMany(), Transaction.deleteMany(), Expense.deleteMany(), Budget.deleteMany(), Investment.deleteMany(), InvestmentGoal.deleteMany(), PortfolioSnapshot.deleteMany(), Notification.deleteMany(), SupportMessage.deleteMany(),
    ]);

    const password = await bcrypt.hash("finora123", 10);
    const users = [];
    for (let i = 0; i < namedUsers.length; i++) {
      const user = await User.create({
        name: namedUsers[i],
        email: `user${i + 1}@gmail.com`,
        password,
        bio: i === 0 ? "Building wealth through consistent tracking and disciplined investing." : "Finora contact user",
        preferences: { currency: "INR", monthlyIncome: i === 0 ? 85000 : 45000, riskProfile: i === 0 ? "Aggressive" : "Moderate", notificationsEmail: true },
      });
      const wallet = await Wallet.create({ user: user._id, balance: i === 0 ? 12000 : 3000 + i * 250 });
      user.wallet = wallet._id;
      await user.save();
      users.push({ user, wallet });
    }

    const demo = users[0];
    const now = new Date();
    await Budget.create({ user: demo.user._id, year: now.getFullYear(), month: now.getMonth() + 1, limit: 12000 });

    const transferRows = [
      { type: "income", amount: 52000, category: "Salary", description: "Monthly salary credited" },
      { type: "expense", amount: 3500, category: "Transfer", description: `Sent to ${users[1].user.name}` },
      { type: "expense", amount: 1800, category: "Transfer", description: `Sent to ${users[2].user.name}` },
      { type: "income", amount: 2200, category: "Refund", description: `Received from ${users[3].user.name}` },
      { type: "expense", amount: 4500, category: "Bills", description: "Internet + electricity payment" },
    ];
    for (const row of transferRows) {
      await Transaction.create({ user: demo.user._id, wallet: demo.wallet._id, ...row, counterpart: row.description.split(" ").slice(-1)[0] });
    }

    const expenseRows = [
      ["Grocery restock", "Big Basket", "Food & Dining", 1840],
      ["Ride to office", "Uber", "Travel", 420],
      ["Electricity bill", "TNEB", "Bills & Utilities", 2150],
      ["Netflix plan", "Netflix", "Entertainment", 649],
      ["Weekend brunch", "Cafe Noir", "Food & Dining", 980],
      ["Laptop sleeve", "Amazon", "Shopping", 1250],
      ["Fuel", "Indian Oil", "Travel", 1600],
    ];
    for (const [title, merchant, category, amount] of expenseRows) {
      await Expense.create({ user: demo.user._id, title, merchant, category, amount, occurredAt: new Date(now.getFullYear(), now.getMonth(), Math.ceil(Math.random() * 20)) });
    }

    const investmentRows = [
      { name: "Tata Consultancy Services", symbol: "TCS", type: "Stocks", units: 12, buyPrice: 3620, currentPrice: 3895, dayChangePct: 0.9, monthlyContribution: 3000 },
      { name: "Nifty Index Fund", symbol: "NIFTY50", type: "Mutual Funds", units: 90, buyPrice: 128.5, currentPrice: 136.2, dayChangePct: 0.4, monthlyContribution: 5000 },
      { name: "Digital Gold", symbol: "GOLD", type: "Gold", units: 18, buyPrice: 6100, currentPrice: 6480, dayChangePct: -0.2, monthlyContribution: 1500 },
      { name: "Bitcoin", symbol: "BTC", type: "Crypto", units: 0.12, buyPrice: 5100000, currentPrice: 5450000, dayChangePct: 1.6, monthlyContribution: 2000 },
      { name: "SBI Fixed Deposit", symbol: "FD", type: "Fixed Deposit", units: 1, buyPrice: 75000, currentPrice: 78250, dayChangePct: 0.05, monthlyContribution: 2500 },
    ];
    for (const inv of investmentRows) {
      await Investment.create({ user: demo.user._id, ...inv, investedAt: new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 5), 10) });
    }

    const snapshots = [198000, 205400, 212600, 219500, 227200, 234950, 241300, 248100];
    for (let i = snapshots.length - 1; i >= 0; i--) {
      await PortfolioSnapshot.create({ user: demo.user._id, monthDate: new Date(now.getFullYear(), now.getMonth() - i, 1), value: snapshots[snapshots.length - 1 - i] });
    }

    await InvestmentGoal.insertMany([
      { user: demo.user._id, title: "Emergency Fund", category: "Safety", targetAmount: 300000, currentAmount: 178000, targetDate: new Date(now.getFullYear(), now.getMonth() + 6, 1) },
      { user: demo.user._id, title: "Car Down Payment", category: "Lifestyle", targetAmount: 500000, currentAmount: 242000, targetDate: new Date(now.getFullYear() + 1, 2, 1) },
      { user: demo.user._id, title: "Retirement Corpus", category: "Long Term", targetAmount: 2500000, currentAmount: 685000, targetDate: new Date(now.getFullYear() + 8, 0, 1) },
    ]);

    await Notification.insertMany([
      { user: demo.user._id, title: "Welcome to Finora", message: "Your finance workspace is ready to use.", type: "success" },
      { user: demo.user._id, title: "Budget check", message: "You are within your monthly budget. Keep it up.", type: "info" },
      { user: demo.user._id, title: "Portfolio update", message: "Your portfolio gained 1.4% this week.", type: "success" },
    ]);

    await SupportMessage.create({ user: demo.user._id, name: demo.user.name, email: demo.user.email, subject: "Sample support thread", message: "How can I export my monthly report?" });

    console.log("Seeding completed successfully!");
    console.log(`Demo login: user1@gmail.com / finora123`);
    console.log(`Demo user id: ${demo.user._id}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
