const express = require("express");
const router = express.Router();

const {
  getCompanies,
  getCompanyStats
} = require("../controllers/companyController");

const { protect } = require("../middlewares/authMiddleware");

// 🔹 Get all companies
router.get("/", protect, getCompanies);

// 📊 Get stats for specific company
router.get("/:companyId/stats", protect, getCompanyStats);

module.exports = router;