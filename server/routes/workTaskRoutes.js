const express = require("express");
const router = express.Router();

const {
  createWorkTask,
  getWorkTasks,
  getMyWork,
  getWorkTaskById,
  updateWorkTask,
  updateWorkProgress,
  deleteWorkTask,
} = require("../controllers/workTaskController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// ========================================
// SUPER ADMIN - CREATE WORK
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("super_admin"),
  createWorkTask
);

// ========================================
// SUPER ADMIN - GET ALL WORK
// ========================================

router.get(
  "/",
  protect,
  authorizeRoles("super_admin"),
  getWorkTasks
);

// ========================================
// EMPLOYEE / INTERN - MY WORK
// IMPORTANT: Keep this BEFORE /:id
// ========================================

router.get(
  "/my-work",
  protect,
  authorizeRoles("employee", "intern"),
  getMyWork
);

// ========================================
// GET SINGLE WORK
// Super Admin / Employee / Intern
// ========================================

router.get(
  "/:id",
  protect,
  authorizeRoles("super_admin", "employee", "intern"),
  getWorkTaskById
);

// ========================================
// SUPER ADMIN - UPDATE WORK
// ========================================

router.put(
  "/:id",
  protect,
  authorizeRoles("super_admin"),
  updateWorkTask
);

// ========================================
// EMPLOYEE / INTERN - UPDATE PROGRESS
// ========================================

router.put(
  "/:id/progress",
  protect,
  authorizeRoles("employee", "intern"),
  updateWorkProgress
);

// ========================================
// SUPER ADMIN - DELETE WORK
// ========================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("super_admin"),
  deleteWorkTask
);

module.exports = router;