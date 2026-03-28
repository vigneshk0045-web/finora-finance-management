import mongoose from "mongoose";

const investmentGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, default: "General" },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, required: true, min: 0, default: 0 },
    targetDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("InvestmentGoal", investmentGoalSchema);
