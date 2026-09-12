const express = require("express");
const router = express.Router();

const {
    createFollowup,
    getFollowups,
    getFollowupById,
    updateFollowup,
    deleteFollowup,
    getTodayFollowUps,
    getMissedFollowUps,
    getUpcomingFollowUps,
} = require("../controllers/followupController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| Follow-up Management
|--------------------------------------------------------------------------
| Super Admin, Employee and Intern can manage follow-ups.
|--------------------------------------------------------------------------
*/

const allowedRoles = authorizeRoles(
    "super_admin",
    "employee",
    "intern"
);

// ============================================================
// FOLLOW-UP DASHBOARD
// ============================================================

// Today's Follow-ups
router.get(
    "/today",
    protect,
    allowedRoles,
    getTodayFollowUps
);

// Missed Follow-ups
router.get(
    "/missed",
    protect,
    allowedRoles,
    getMissedFollowUps
);

// Upcoming Follow-ups
router.get(
    "/upcoming",
    protect,
    allowedRoles,
    getUpcomingFollowUps
);

// ============================================================
// FOLLOW-UP CRUD
// ============================================================

// Create Follow-up
router.post(
    "/",
    protect,
    allowedRoles,
    createFollowup
);

// Get All Follow-ups
router.get(
    "/",
    protect,
    allowedRoles,
    getFollowups
);

// Get Follow-up By ID
router.get(
    "/:id",
    protect,
    allowedRoles,
    getFollowupById
);

// Update Follow-up
router.put(
    "/:id",
    protect,
    allowedRoles,
    updateFollowup
);

// Delete Follow-up
router.delete(
    "/:id",
    protect,
    allowedRoles,
    deleteFollowup
);

module.exports = router;