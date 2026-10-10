import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  getDreamGoals,
  createDreamGoal,
  updateDreamGoal,
  deleteDreamGoal,
  markAchieved,
} from "../controllers/savings.js";

const router = Router();
router.use(auth);

router.get("/", getDreamGoals);
router.post("/", createDreamGoal);
router.put("/:id", updateDreamGoal);
router.delete("/:id", deleteDreamGoal);
router.patch("/:id/achieve", markAchieved);

export default router;
