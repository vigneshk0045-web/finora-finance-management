import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    symbol: { type: String, default: "" },
    type: {
      type: String,
      enum: ["Stocks", "Mutual Funds", "Gold", "Crypto", "Fixed Deposit", "ETF", "Bonds", "Other"],
      default: "Other",
    },
    units: { type: Number, required: true, min: 0 },
    buyPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    dayChangePct: { type: Number, default: 0 },
    monthlyContribution: { type: Number, default: 0 },
    investedAt: { type: Date, default: Date.now },
    walletTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
  },
  { timestamps: true }
);

investmentSchema.virtual("investedAmount").get(function () {
  return Number((this.units * this.buyPrice).toFixed(2));
});

investmentSchema.virtual("currentValue").get(function () {
  return Number((this.units * this.currentPrice).toFixed(2));
});

investmentSchema.set("toJSON", { virtuals: true });
investmentSchema.set("toObject", { virtuals: true });

export default mongoose.model("Investment", investmentSchema);
