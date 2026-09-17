const express = require("express");

const router = express.Router();

const {
  createWorkLog,
  getMyWorkLogs,
  getAllWorkLogs,
  updateWorkLog,
  deleteWorkLog,
} = require("../controllers/workLogController");

const {
  protect,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

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

// Update own work log
router.put(
  "/:id",
  protect,
  authorizeRoles("employee", "intern"),
  updateWorkLog
);

// Delete own work log
router.delete(
  "/:id",
  protect,
  authorizeRoles("employee", "intern"),
  deleteWorkLog
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