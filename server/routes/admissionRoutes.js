const express = require("express");
const router = express.Router();

const {
    createAdmission,
    getAdmissions,
    getAdmissionById,
    updateAdmission,
    deleteAdmission,
} = require("../controllers/admissionController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| Admission Management
|--------------------------------------------------------------------------
| Super Admin and Employee can manage admissions.
|--------------------------------------------------------------------------
*/

// Create Admission
router.post(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    createAdmission
);

// Get All Admissions
router.get(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    getAdmissions
);

// Get Admission By ID
router.get(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    getAdmissionById
);

// Update Admission
router.put(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    updateAdmission
);

// Delete Admission
router.delete(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    deleteAdmission
);

module.exports = router;