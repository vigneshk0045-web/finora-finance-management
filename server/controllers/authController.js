import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { signToken } from "../utils/auth.js";

const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  role: user.role,
  wallet: user.wallet,
  preferences: user.preferences,
});

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
    const wallet = await Wallet.create({ user: user._id, balance: 0 });
    user.wallet = wallet._id;
    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password || "", user.password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json({ user: safeUser(req.user) });
};

export const forgotPassword = async (req, res) => {
  res.json({ message: "Password reset flow stubbed for portfolio demo. Use the demo account credentials on the login screen." });
};

export const resetPassword = async (req, res) => {
  res.json({ message: "Password reset flow stubbed for portfolio demo." });
};
