import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    role: { type: String, default: "user" },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },
    preferences: {
      currency: { type: String, default: "INR" },
      monthlyIncome: { type: Number, default: 45000 },
      riskProfile: { type: String, default: "Moderate" },
      notificationsEmail: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
