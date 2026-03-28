import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    limit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);
