import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    merchant: { type: String, default: "" },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    occurredAt: { type: Date, default: Date.now },
    recurring: { type: Boolean, default: false },
    walletTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
