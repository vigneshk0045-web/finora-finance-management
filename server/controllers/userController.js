import bcrypt from "bcryptjs";
import User from "../models/User.js";

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

export const getContacts = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email avatar")
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  res.json({ user: safeUser(req.user) });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, bio, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (preferences) {
      user.preferences = { ...user.preferences.toObject(), ...preferences };
    }
    await user.save();
    res.json({ user: safeUser(user), message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const ok = await bcrypt.compare(currentPassword || "", user.password);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
