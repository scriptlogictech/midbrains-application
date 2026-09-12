const express = require("express");
const router = express.Router();

const {
    createLead,
    getLeads,
    updateLead,
    updateLeadStatus,
    addCommunication,
} = require("../controllers/leadController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| Lead Management
|--------------------------------------------------------------------------
| Super Admin, Employee and Intern can manage leads.
|--------------------------------------------------------------------------
*/

// ==========================================
// Create Lead
// ==========================================

router.post(
    "/",
    protect,
    authorizeRoles(
        "super_admin",
        "employee",
        "intern"
    ),
    createLead
);

// ==========================================
// Get All Leads
// ==========================================

router.get(
    "/",
    protect,
    authorizeRoles(
        "super_admin",
        "employee",
        "intern"
    ),
    getLeads
);

// ==========================================
// Update Lead
// ==========================================

router.put(
    "/:leadId",
    protect,
    authorizeRoles(
        "super_admin",
        "employee",
        "intern"
    ),
    updateLead
);

// ==========================================
// Update Lead Status
// ==========================================

router.put(
    "/:leadId/status",
    protect,
    authorizeRoles(
        "super_admin",
        "employee",
        "intern"
    ),
    updateLeadStatus
);

// ==========================================
// Add Communication
// ==========================================

router.post(
    "/:leadId/communication",
    protect,
    authorizeRoles(
        "super_admin",
        "employee",
        "intern"
    ),
    addCommunication
);

module.exports = router;