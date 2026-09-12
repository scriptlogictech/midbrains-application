const Lead = require("../models/Lead");

const getCompanyFilter = (req) => {
    if (req.user.role === "super_admin") {
        return {};
    }

    return {
        company: req.user.company,
    };
};

// ============================================================
// CREATE FOLLOW-UP
// ============================================================
exports.createFollowup = async (req, res) => {
    try {
        const {
            leadId,
            nextFollowUpDate,
            notes,
        } = req.body;

        if (!leadId || !nextFollowUpDate) {
            return res.status(400).json({
                success: false,
                message: "Lead ID and follow-up date are required",
            });
        }

        const lead = await Lead.findOne({
            _id: leadId,
            ...getCompanyFilter(req),
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        lead.nextFollowUpDate = nextFollowUpDate;

        if (notes !== undefined) {
            lead.notes = notes;
        }

        if (lead.status !== "converted" && lead.status !== "closed") {
            lead.status = "follow_up";
        }

        await lead.save();

        const updatedLead = await Lead.findById(lead._id)
            .populate("company", "companyName")
            .populate("assignedCounselor", "fullName email role");

        return res.status(200).json({
            success: true,
            message: "Follow-up created successfully",
            followUp: updatedLead,
        });
    } catch (error) {
        console.error("Create Follow-up Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating follow-up",
            error: error.message,
        });
    }
};

// ============================================================
// GET ALL FOLLOW-UPS
// ============================================================
exports.getFollowups = async (req, res) => {
    try {
        const leads = await Lead.find({
            ...getCompanyFilter(req),
            nextFollowUpDate: { $exists: true, $ne: null },
        })
            .populate("company", "companyName")
            .populate("assignedCounselor", "fullName email role")
            .sort({ nextFollowUpDate: 1 });

        return res.status(200).json({
            success: true,
            followUps: leads,
        });
    } catch (error) {
        console.error("Get Follow-ups Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching follow-ups",
            error: error.message,
        });
    }
};

// ============================================================
// GET FOLLOW-UP BY ID
// ============================================================
exports.getFollowupById = async (req, res) => {
    try {
        const { id } = req.params;

        const lead = await Lead.findOne({
            _id: id,
            ...getCompanyFilter(req),
        })
            .populate("company", "companyName")
            .populate("assignedCounselor", "fullName email role");

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found",
            });
        }

        return res.status(200).json({
            success: true,
            followUp: lead,
        });
    } catch (error) {
        console.error("Get Follow-up Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching follow-up",
            error: error.message,
        });
    }
};

// ============================================================
// UPDATE FOLLOW-UP
// ============================================================
exports.updateFollowup = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nextFollowUpDate,
            notes,
            status,
            priority,
            assignedCounselor,
        } = req.body;

        const lead = await Lead.findOne({
            _id: id,
            ...getCompanyFilter(req),
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found",
            });
        }

        if (nextFollowUpDate !== undefined) {
            lead.nextFollowUpDate = nextFollowUpDate;
        }

        if (notes !== undefined) {
            lead.notes = notes;
        }

        if (status !== undefined) {
            lead.status = status;
        }

        if (priority !== undefined) {
            lead.priority = priority;
        }

        if (assignedCounselor !== undefined) {
            const user = await require("../models/User").findOne({
                _id: assignedCounselor,
                company: lead.company,
                role: { $in: ["employee", "intern"] },
                isActive: true,
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Assigned user must be an active employee or intern",
                });
            }

            lead.assignedCounselor = assignedCounselor;
        }

        await lead.save();

        const updatedLead = await Lead.findById(lead._id)
            .populate("company", "companyName")
            .populate("assignedCounselor", "fullName email role");

        return res.status(200).json({
            success: true,
            message: "Follow-up updated successfully",
            followUp: updatedLead,
        });
    } catch (error) {
        console.error("Update Follow-up Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating follow-up",
            error: error.message,
        });
    }
};

// ============================================================
// DELETE FOLLOW-UP
// ============================================================
exports.deleteFollowup = async (req, res) => {
    try {
        const { id } = req.params;

        const lead = await Lead.findOne({
            _id: id,
            ...getCompanyFilter(req),
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found",
            });
        }

        lead.nextFollowUpDate = null;

        if (lead.status === "follow_up") {
            lead.status = "contacted";
        }

        await lead.save();

        return res.status(200).json({
            success: true,
            message: "Follow-up removed successfully",
        });
    } catch (error) {
        console.error("Delete Follow-up Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting follow-up",
            error: error.message,
        });
    }
};

// ============================================================
// TODAY FOLLOW-UPS
// ============================================================
exports.getTodayFollowUps = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const leads = await Lead.find({
            ...getCompanyFilter(req),
            nextFollowUpDate: {
                $gte: today,
                $lt: tomorrow,
            },
        })
            .populate("company", "companyName")
            .populate("assignedCounselor", "fullName email role")
            .sort({ nextFollowUpDate: 1 });

        return res.status(200).json({
            success: true,
            followUps: leads,
        });
    } catch (error) {
        console.error("Today Follow-ups Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching today's follow-ups",
            error: error.message,
        });
    }
};

// ============================================================
// MISSED FOLLOW-UPS
// ============================================================
exports.getMissedFollowUps = async (req, res) => {
    try {
        const today = new Date();

        const leads = await Lead.find({
            ...getCompanyFilter(req),
            nextFollowUpDate: { $lt: today },
            status: {
                $nin: ["converted", "closed"],
            },
        })
            .populate("company", "companyName")
            .populate("assignedCounselor", "fullName email role")
            .sort({ nextFollowUpDate: 1 });

        return res.status(200).json({
            success: true,
            followUps: leads,
        });
    } catch (error) {
        console.error("Missed Follow-ups Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching missed follow-ups",
            error: error.message,
        });
    }
};

// ============================================================
// UPCOMING FOLLOW-UPS
// ============================================================
exports.getUpcomingFollowUps = async (req, res) => {
    try {
        const today = new Date();

        const leads = await Lead.find({
            ...getCompanyFilter(req),
            nextFollowUpDate: { $gt: today },
        })
            .populate("company", "companyName")
            .populate("assignedCounselor", "fullName email role")
            .sort({ nextFollowUpDate: 1 });

        return res.status(200).json({
            success: true,
            followUps: leads,
        });
    } catch (error) {
        console.error("Upcoming Follow-ups Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching upcoming follow-ups",
            error: error.message,
        });
    }
};