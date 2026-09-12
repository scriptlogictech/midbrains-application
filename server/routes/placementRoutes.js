const express = require("express");
const router = express.Router();

const {
    createPlacement,
    getPlacements,
    getCompanyPlacements,
    getPlacementById,
    updatePlacement,
    updatePlacementStatus,
    deletePlacement,
} = require("../controllers/placementController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| Placement Management
|--------------------------------------------------------------------------
| Super Admin and Employee can manage placements.
| Interns do not have access to this module.
|--------------------------------------------------------------------------
*/

// Create Placement
router.post(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    createPlacement
);

// Get All Placements
router.get(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    getPlacements
);

// Get Company Placements
// IMPORTANT: Keep this route before /:id
router.get(
    "/company/:companyId",
    protect,
    authorizeRoles("super_admin", "employee"),
    getCompanyPlacements
);

// Get Placement By ID
router.get(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    getPlacementById
);

// Update Placement Status
router.put(
    "/:id/status",
    protect,
    authorizeRoles("super_admin", "employee"),
    updatePlacementStatus
);

// Update Placement
router.put(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    updatePlacement
);

// Delete Placement
router.delete(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    deletePlacement
);

module.exports = router;