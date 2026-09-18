
const express = require("express");

const router = express.Router();

const {
    createInstagramReelData,
    getInstagramReelData,
    getSingleInstagramReelData,
    updateInstagramReelData,
    deleteInstagramReelData,
    getCompanyEmployees,
    addFollowUp,
} = require("../controllers/instagramReelDataController");

const {
    protect,
    authorizeRoles,
} = require("../middlewares/authMiddleware");

// Allowed roles
const allowedRoles = authorizeRoles(
    "super_admin",
    "employee"
);

// Create a new Instagram Reel record
router.post(
    "/",
    protect,
    allowedRoles,
    createInstagramReelData
);

// Get all Instagram Reel records
router.get(
    "/",
    protect,
    allowedRoles,
    getInstagramReelData
);

// Get company employees
router.get(
    "/employees",
    protect,
    allowedRoles,
    getCompanyEmployees
);

// Get a single record
router.get(
    "/:id",
    protect,
    allowedRoles,
    getSingleInstagramReelData
);

// Update a record
router.put(
    "/:id",
    protect,
    allowedRoles,
    updateInstagramReelData
);

// Delete a record
router.delete(
    "/:id",
    protect,
    authorizeRoles("super_admin"),
    deleteInstagramReelData
);

// Add follow-up
router.post(
    "/:id/follow-up",
    protect,
    allowedRoles,
    addFollowUp
);

module.exports = router;