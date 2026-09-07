const express = require("express");
const router = express.Router();

const {
  dashboardSummary,
  leadReport,
  revenueReport,
  placementReport,
} = require("../controllers/reportController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

router.get(
  "/dashboard",
  protect,
  authorizeRoles("super_admin"),
  dashboardSummary
);

router.get(
  "/leads",
  protect,
  authorizeRoles("super_admin"),
  leadReport
);

router.get(
  "/revenue",
  protect,
  authorizeRoles("super_admin"),
  revenueReport
);

router.get(
  "/placements",
  protect,
  authorizeRoles("super_admin"),
  placementReport
);

module.exports = router;