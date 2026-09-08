const express = require("express");
const router = express.Router();

const {
  createWorkLog,
  getMyWorkLogs,
  getTaskWorkLogs,
  getAllWorkLogs,
} = require("../controllers/workLogController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// ========================================
// EMPLOYEE / INTERN - CREATE DAILY LOG
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("employee", "intern"),
  createWorkLog
);

// ========================================
// EMPLOYEE / INTERN - MY WORK LOGS
// ========================================

router.get(
  "/my-logs",
  protect,
  authorizeRoles("employee", "intern"),
  getMyWorkLogs
);

// ========================================
// SUPER ADMIN / EMPLOYEE / INTERN
// GET LOGS FOR SPECIFIC TASK
// ========================================

router.get(
  "/task/:taskId",
  protect,
  authorizeRoles("super_admin", "employee", "intern"),
  getTaskWorkLogs
);

// ========================================
// SUPER ADMIN - ALL WORK LOGS
// ========================================

router.get(
  "/",
  protect,
  authorizeRoles("super_admin"),
  getAllWorkLogs
);

module.exports = router;