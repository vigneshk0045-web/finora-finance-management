import express from "express";
import { getContacts, getProfile, updatePassword, updateProfile } from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(requireAuth);
router.get("/contacts", getContacts);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/password", updatePassword);
export default router;
