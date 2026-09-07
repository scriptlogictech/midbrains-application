const express = require("express");
const router = express.Router();

const {
  getTodayFollowUps,
  getMissedFollowUps,
  getUpcomingFollowUps
} = require("../controllers/followupController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/today", protect, getTodayFollowUps);
router.get("/missed", protect, getMissedFollowUps);
router.get("/upcoming", protect, getUpcomingFollowUps);

module.exports = router;