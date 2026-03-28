import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const fmt = (n) => Number((n || 0).toFixed(2));
const currentUserId = (req) => req.user?._id || req.params.userId;

export const transferMoney = async (req, res) => {
  try {
    const senderId = currentUserId(req);
    const { receiverId, amount, note } = req.body;
    if (!receiverId) return res.status(400).json({ message: "Receiver required" });
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });

    const [sender, receiver, senderWallet, receiverWallet] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
      Wallet.findOne({ user: senderId }),
      Wallet.findOne({ user: receiverId }),
    ]);
    if (!sender || !receiver || !senderWallet || !receiverWallet) return res.status(404).json({ message: "User or wallet not found" });
    if (senderWallet.balance < amt) return res.status(400).json({ message: "Insufficient balance" });

    senderWallet.balance = fmt(senderWallet.balance - amt);
    receiverWallet.balance = fmt(receiverWallet.balance + amt);
    await Promise.all([senderWallet.save(), receiverWallet.save()]);

    const senderTx = await Transaction.create({ user: senderId, wallet: senderWallet._id, type: "expense", amount: amt, category: "Transfer", description: `Sent to ${receiver.name}`, counterpart: receiver.name, counterpartUser: receiver._id });
    await Transaction.create({ user: receiverId, wallet: receiverWallet._id, type: "income", amount: amt, category: "Transfer", description: `Received from ${sender.name}`, counterpart: sender.name, counterpartUser: sender._id });
    await Notification.create({ user: senderId, title: "Transfer completed", message: `₹${amt.toLocaleString()} sent to ${receiver.name}${note ? ` · ${note}` : ""}.`, type: "success" });

    res.json({ success: true, balance: senderWallet.balance, transaction: senderTx });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: currentUserId(req) });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    res.json({ balance: wallet.balance });
  } catch {
    res.status(500).json({ message: "Error fetching balance" });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const q = req.query.q?.toLowerCase();
    let transactions = await Transaction.find({ user: currentUserId(req) }).sort({ createdAt: -1 }).populate("counterpartUser", "name email");
    if (q) transactions = transactions.filter((t) => `${t.description} ${t.category} ${t.counterpart}`.toLowerCase().includes(q));
    res.json(transactions);
  } catch {
    res.status(500).json({ message: "Error fetching transactions" });
  }
};

export const topUp = async (req, res) => {
  try {
    const userId = currentUserId(req);
    const amt = Number(req.body.amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    wallet.balance = fmt(wallet.balance + amt);
    await wallet.save();
    const tx = await Transaction.create({ user: userId, wallet: wallet._id, type: "income", amount: amt, category: "Top Up", description: req.body.description || "Top up added" });
    await Notification.create({ user: userId, title: "Wallet topped up", message: `₹${amt.toLocaleString()} added to your wallet.`, type: "success" });
    res.json({ balance: wallet.balance, transaction: tx });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
