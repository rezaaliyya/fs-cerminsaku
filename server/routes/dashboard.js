import { Router } from "express";
import auth from "../middleware/auth.js";
import { getDashboardSummary } from "../controllers/dashboard.js";

const router = Router();
router.get("/", auth, getDashboardSummary);

export default router;
