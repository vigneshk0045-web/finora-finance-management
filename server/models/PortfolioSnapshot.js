import mongoose from "mongoose";

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    monthDate: { type: Date, required: true },
    value: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("PortfolioSnapshot", portfolioSnapshotSchema);
