import SupportMessage from "../models/SupportMessage.js";

export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ message: "All fields are required" });
    const row = await SupportMessage.create({ user: req.user?._id || null, name, email, subject, message });
    res.status(201).json({ message: "Your message has been received.", item: row });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
