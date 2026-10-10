const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  getDreamGoals,
  createDreamGoal,
  updateDreamGoal,
  deleteDreamGoal,
  markAchieved 
} = require("../controllers/savingController");

router.get(
  "/",
  auth,
  getDreamGoals
);

router.post(
  "/",
  auth,
  createDreamGoal
);

router.put(
  "/:id",
  auth,
  updateDreamGoal
);

router.delete(
  "/:id",
  auth,
  deleteDreamGoal
);

router.patch(
  "/:id/achieve",
  auth,
  markAchieved
);

module.exports = router;