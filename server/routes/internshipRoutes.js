const express = require("express");
const router = express.Router();

const {
    createInternship,
    getInternships,
    getCompanyInternships,
    getInternshipById,
    updateInternship,
    updateInternshipStatus,
    deleteInternship,
} = require("../controllers/internshipController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// Create internship
router.post(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    createInternship
);

// Get all internships
router.get(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    getInternships
);

// Get company internships
router.get(
    "/company/:companyId",
    protect,
    authorizeRoles("super_admin", "employee"),
    getCompanyInternships
);

// Get single internship
router.get(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    getInternshipById
);

// Update internship status
router.put(
    "/:id/status",
    protect,
    authorizeRoles("super_admin", "employee"),
    updateInternshipStatus
);

// Update internship
router.put(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    updateInternship
);

// Delete internship
router.delete(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    deleteInternship
);

module.exports = router;