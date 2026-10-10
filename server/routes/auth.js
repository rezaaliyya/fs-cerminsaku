import { Router } from "express";
import {
  register,
  verifyOtp,
  login,
  sendResetOtp,
  verifyResetOtp,
  resetPassword,
} from "../controllers/auth.js";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", sendResetOtp);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

export default router;
