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

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| User Management
|--------------------------------------------------------------------------
| Only Super Admin can create, update, activate/deactivate users.
|--------------------------------------------------------------------------
*/

// Create Employee / Intern
router.post(
    "/",
    protect,
    authorizeRoles("super_admin"),
    createUser
);

// Get all users
router.get(
    "/",
    protect,
    authorizeRoles("super_admin"),
    getUsers
);

// Get users of a specific company
router.get(
    "/company/:companyId",
    protect,
    getCompanyUsers
);

// Get active employees of a specific company
// Function name is kept as getCompanyCounselors
// to avoid changing the existing frontend/service architecture.
router.get(
    "/company/:companyId/counselors",
    protect,
    getCompanyCounselors
);

// Update Employee / Intern
router.put(
    "/:id",
    protect,
    authorizeRoles("super_admin"),
    updateUser
);

// Activate / Deactivate Employee / Intern
router.put(
    "/:id/status",
    protect,
    authorizeRoles("super_admin"),
    updateUserStatus
);

module.exports = router;