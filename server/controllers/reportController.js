import PDFDocument from "pdfkit";
import Expense from "../models/Expense.js";
import Investment from "../models/Investment.js";
import Wallet from "../models/Wallet.js";

const fmt = (n) => Number((n || 0).toFixed(2));
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1);

export const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const expenses = await Expense.find({ user: userId, occurredAt: { $gte: startOfMonth(now), $lt: endOfMonth(now) } });
    const investments = await Investment.find({ user: userId });
    const wallet = await Wallet.findOne({ user: userId });
    const totalExpenses = fmt(expenses.reduce((s, x) => s + x.amount, 0));
    const totalInvested = fmt(investments.reduce((s, x) => s + x.units * x.buyPrice, 0));
    const portfolioValue = fmt(investments.reduce((s, x) => s + x.units * x.currentPrice, 0));
    const savingsRate = req.user.preferences?.monthlyIncome
      ? Math.max(0, Math.round(((req.user.preferences.monthlyIncome - totalExpenses) / req.user.preferences.monthlyIncome) * 100))
      : 0;

    const categories = {};
    expenses.forEach((e) => {
      categories[e.category] = fmt((categories[e.category] || 0) + e.amount);
    });

    res.json({
      month: now.toLocaleString(undefined, { month: "long", year: "numeric" }),
      walletBalance: fmt(wallet?.balance || 0),
      totalExpenses,
      totalInvested,
      portfolioValue,
      savingsRate,
      categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const exportMonthlyCsv = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const expenses = await Expense.find({ user: userId, occurredAt: { $gte: startOfMonth(now), $lt: endOfMonth(now) } });
    const lines = ["Title,Category,Amount,Date"];
    expenses.forEach((e) => {
      lines.push(`"${(e.title || '').replace(/"/g, '""')}","${(e.category || '').replace(/"/g, '""')}",${fmt(e.amount)},"${e.occurredAt.toISOString().slice(0,10)}"`);
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="finora-report-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}.csv"`);
    res.send(lines.join('\n'));
PLACEHOLDER
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportMonthlyPdf = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const expenses = await Expense.find({ user: userId, occurredAt: { $gte: startOfMonth(now), $lt: endOfMonth(now) } }).sort({ occurredAt: -1 });
    const investments = await Investment.find({ user: userId });
    const wallet = await Wallet.findOne({ user: userId });
    const totalExpenses = fmt(expenses.reduce((s, x) => s + x.amount, 0));
    const portfolioValue = fmt(investments.reduce((s, x) => s + x.units * x.currentPrice, 0));
    const totalInvested = fmt(investments.reduce((s, x) => s + x.units * x.buyPrice, 0));
    const savingsRate = req.user.preferences?.monthlyIncome
      ? Math.max(0, Math.round(((req.user.preferences.monthlyIncome - totalExpenses) / req.user.preferences.monthlyIncome) * 100))
      : 0;
    const categories = {};
    expenses.forEach((e) => { categories[e.category] = fmt((categories[e.category] || 0) + e.amount); });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="finora-report-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}.pdf"`);
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(22).fillColor('#0f172a').text('Finora Monthly Report');
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor('#64748b').text(now.toLocaleString(undefined, { month: 'long', year: 'numeric' }));
    doc.moveDown();
    doc.fontSize(14).fillColor('#0f172a').text('Summary');
    doc.fontSize(11).fillColor('#0f172a');
    [
      ['Wallet balance', `₹${fmt(wallet?.balance || 0).toLocaleString()}`],
      ['Expenses', `₹${totalExpenses.toLocaleString()}`],
      ['Portfolio value', `₹${portfolioValue.toLocaleString()}`],
      ['Total invested', `₹${totalInvested.toLocaleString()}`],
      ['Savings rate', `${savingsRate}%`],
    ].forEach(([k,v])=> doc.text(`${k}: ${v}`));
    doc.moveDown();
    doc.fontSize(14).text('Expense categories');
    doc.fontSize(11);
    const catEntries = Object.entries(categories);
    if (catEntries.length === 0) doc.text('No expenses recorded this month.');
    catEntries.forEach(([k,v])=> doc.text(`${k}: ₹${v.toLocaleString()}`));
    doc.moveDown();
    doc.fontSize(14).text('Recent expenses');
    doc.fontSize(11);
    if (expenses.length === 0) doc.text('No expenses recorded this month.');
    expenses.slice(0,10).forEach((e)=> doc.text(`${e.title} · ${e.category} · ₹${fmt(e.amount).toLocaleString()} · ${e.occurredAt.toISOString().slice(0,10)}`));
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
