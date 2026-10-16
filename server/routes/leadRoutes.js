
const express = require("express");
const router = express.Router();

const {
    createLead,
    getLeads,
    updateLead,
    updateLeadStatus,
    addCommunication,
    updateCommunication,
    deleteCommunication,
} = require("../controllers/leadController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

const leadAccess = [
    protect,
    authorizeRoles("super_admin", "employee", "intern"),
];

// Create Lead
router.post("/", ...leadAccess, createLead);

// Get All Leads
router.get("/", ...leadAccess, getLeads);

// Update Lead
router.put("/:leadId", ...leadAccess, updateLead);

// Update Lead Status
router.put("/:leadId/status", ...leadAccess, updateLeadStatus);

// Add Communication
router.post(
    "/:leadId/communication",
    ...leadAccess,
    addCommunication
);

// Update Communication
router.put(
    "/:leadId/communication/:communicationId",
    ...leadAccess,
    updateCommunication
);

// Delete Communication
router.delete(
    "/:leadId/communication/:communicationId",
    ...leadAccess,
    deleteCommunication
);

module.exports = router;
