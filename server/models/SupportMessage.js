import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "open" },
  },
  { timestamps: true }
);

export default mongoose.model("SupportMessage", supportMessageSchema);
