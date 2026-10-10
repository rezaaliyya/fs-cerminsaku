import { Router } from "express";
import auth from "../middleware/auth.js";
import { getProfile, updateProfile, updatePassword } from "../controllers/profile.js";

const router = Router();
router.use(auth);

router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/password", updatePassword);

export default router;
