const express = require("express");
const router = express.Router();

const {
    getLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    addCommunication,
} = require("../controllers/leadController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/:companyId", protect, getLeads);

router.post("/", protect, createLead);

router.put("/:leadId", protect, updateLead);

router.put(
    "/:leadId/status",
    protect,
    updateLeadStatus
);

router.post(
    "/:leadId/communication",
    protect,
    addCommunication
);

module.exports = router;