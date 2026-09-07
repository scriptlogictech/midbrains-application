const express = require("express");

const router = express.Router();

const {
    createAdmission,
    getAdmissions,
    getCompanyAdmissions,
} = require("../controllers/admissionController");

const { protect } = require("../middlewares/authMiddleware");

// Create Admission
router.post(
    "/",
    protect,
    createAdmission
);

// Get Admissions
router.get(
    "/",
    protect,
    getAdmissions
);

// Get Company Admissions
router.get(
    "/company/:companyId",
    protect,
    getCompanyAdmissions
);

module.exports = router;