import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: "General" },
    description: { type: String, required: true },
    counterpart: { type: String, default: "" },
    counterpartUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
