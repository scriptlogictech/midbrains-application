const express = require("express");
const router = express.Router();

const {
  createPlacement,
  getPlacements,
  getCompanyPlacements,
  updatePlacementStatus,
} = require("../controllers/placementController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// ==========================================
// CREATE PLACEMENT
// ==========================================
router.post(
  "/",
  protect,
  authorizeRoles("super_admin", "placement_coordinator"),
  createPlacement
);

// ==========================================
// GET ALL PLACEMENTS
// ==========================================
router.get(
  "/",
  protect,
  authorizeRoles("super_admin", "placement_coordinator"),
  getPlacements
);

// ==========================================
// GET COMPANY PLACEMENTS
// ==========================================
router.get(
  "/company/:companyId",
  protect,
  authorizeRoles("super_admin", "placement_coordinator"),
  getCompanyPlacements
);

// ==========================================
// UPDATE PLACEMENT STATUS
// ==========================================
router.put(
  "/:id/status",
  protect,
  authorizeRoles("super_admin", "placement_coordinator"),
  updatePlacementStatus
);

module.exports = router;