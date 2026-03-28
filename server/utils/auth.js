import jwt from "jsonwebtoken";

export const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET || "finora-secret", {
    expiresIn: "7d",
  });
