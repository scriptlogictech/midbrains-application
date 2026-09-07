const express = require("express");

const router = express.Router();

const {
  createUser,
  getUsers,
  getCompanyUsers,
  getCompanyCounselors,
  updateUser,
  updateUserStatus,
} = require("../controllers/userController");

const {
  protect,
} = require("../middlewares/authMiddleware");

const {
  authorizeRoles,
} = require("../middlewares/roleMiddleware");

// ========================================
// USER MANAGEMENT
// ========================================

router.post(
  "/",
  protect,
  authorizeRoles("super_admin"),
  createUser
);

router.get(
  "/",
  protect,
  authorizeRoles("super_admin"),
  getUsers
);

router.get(
  "/company/:companyId",
  protect,
  getCompanyUsers
);

router.get(
  "/company/:companyId/counselors",
  protect,
  getCompanyCounselors
);

router.put(
  "/:id",
  protect,
  authorizeRoles("super_admin"),
  updateUser
);

router.put(
  "/:id/status",
  protect,
  authorizeRoles("super_admin"),
  updateUserStatus
);

module.exports = router;