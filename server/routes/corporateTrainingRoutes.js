const express = require("express");

const router = express.Router();

const {
    createCorporateTraining,
    getCorporateTrainings,
    getCompanyCorporateTrainings,
    updateTrainingStatus,
} = require("../controllers/corporateTrainingController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// Create
router.post(
    "/",
    protect,
    authorizeRoles("super_admin", "trainer"),
    createCorporateTraining
);

// Get all
router.get(
    "/",
    protect,
    authorizeRoles("super_admin", "trainer"),
    getCorporateTrainings
);

// Get company trainings
router.get(
    "/company/:companyId",
    protect,
    authorizeRoles("super_admin", "trainer"),
    getCompanyCorporateTrainings
);

// Update training status
router.put(
    "/:id/status",
    protect,
    authorizeRoles("super_admin", "trainer"),
    updateTrainingStatus
);

module.exports = router;