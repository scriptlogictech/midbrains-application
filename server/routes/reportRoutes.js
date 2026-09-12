const express = require("express");
const router = express.Router();

const {
    getLeadReport,
    getAdmissionReport,
    getInternshipReport,
    getCorporateTrainingReport,
    getProjectReport,
    getPlacementReport,
} = require("../controllers/reportController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
| Super Admin and Employee can view reports.
|--------------------------------------------------------------------------
*/

// Lead Report
router.get(
    "/leads",
    protect,
    authorizeRoles("super_admin", "employee"),
    getLeadReport
);

// Admission Report
router.get(
    "/admissions",
    protect,
    authorizeRoles("super_admin", "employee"),
    getAdmissionReport
);

// Internship Report
router.get(
    "/internships",
    protect,
    authorizeRoles("super_admin", "employee"),
    getInternshipReport
);

// Corporate Training Report
router.get(
    "/corporate-training",
    protect,
    authorizeRoles("super_admin", "employee"),
    getCorporateTrainingReport
);

// Project Report
router.get(
    "/projects",
    protect,
    authorizeRoles("super_admin", "employee"),
    getProjectReport
);

// Placement Report
router.get(
    "/placements",
    protect,
    authorizeRoles("super_admin", "employee"),
    getPlacementReport
);

module.exports = router;