
const express = require("express");

const router = express.Router();

const {
  createWorkLog,
  getMyWorkLogs,
  getAllWorkLogs,
} = require("../controllers/workLogController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// ============================================================
// EMPLOYEE / INTERN
// ============================================================

// Submit personal work
router.post(
  "/",
  protect,
  authorizeRoles("employee", "intern"),
  createWorkLog
);

// View own work logs
router.get(
  "/my-logs",
  protect,
  authorizeRoles("employee", "intern"),
  getMyWorkLogs
);

// ============================================================
// SUPER ADMIN
// ============================================================

// View all employees' and interns' work logs
router.get(
  "/",
  protect,
  authorizeRoles("super_admin"),
  getAllWorkLogs
);

module.exports = router;