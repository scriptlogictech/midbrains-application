const express = require("express");
const router = express.Router();

const {
    createCorporateTraining,
    getCorporateTrainings,
    getCompanyCorporateTrainings,
    getCorporateTrainingById,
    updateCorporateTraining,
    updateTrainingStatus,
    deleteCorporateTraining,
} = require("../controllers/corporateTrainingController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| Corporate Training Management
|--------------------------------------------------------------------------
| Super Admin and Employee can manage corporate training.
| Intern cannot access this module.
|--------------------------------------------------------------------------
*/

// Create Corporate Training
router.post(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    createCorporateTraining
);

// Get All Corporate Trainings
router.get(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    getCorporateTrainings
);

// Get Company Corporate Trainings
// IMPORTANT: Keep this before /:id
router.get(
    "/company/:companyId",
    protect,
    authorizeRoles("super_admin", "employee"),
    getCompanyCorporateTrainings
);

// Get Corporate Training By ID
router.get(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    getCorporateTrainingById
);

// Update Corporate Training Status
// IMPORTANT: Keep this before /:id
router.put(
    "/:id/status",
    protect,
    authorizeRoles("super_admin", "employee"),
    updateTrainingStatus
);

// Update Corporate Training
router.put(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    updateCorporateTraining
);

// Delete Corporate Training
router.delete(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    deleteCorporateTraining
);

module.exports = router;