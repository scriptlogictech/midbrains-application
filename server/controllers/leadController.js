const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const User = require("../models/User");
const LeadCounter = require("../models/LeadCounter");

// Get the logged-in user's company ID safely
const getUserCompanyId = (req) => {
    const company = req?.user?.company;

    if (!company) {
        return null;
    }

    // Company is a populated document
    if (typeof company === "object" && company._id) {
        return company._id.toString();
    }

    // Company is an ObjectId or string
    return company.toString();
};

// Check whether the user can access a company
const hasCompanyAccess = (req, companyId) => {
    if (!req.user || !companyId) {
        return false;
    }

    // Super Admin can access all companies
    if (req.user.role === "super_admin") {
        return true;
    }

    const userCompanyId = getUserCompanyId(req);

    return Boolean(
        userCompanyId &&
        userCompanyId === companyId.toString()
    );
};

// Determine the company for the leads query
const getTargetCompany = (req, requestedCompanyId) => {
    // Super Admin can select a company or view all companies
    if (req.user?.role === "super_admin") {
        return requestedCompanyId || null;
    }

    // Employees/interns: honour the selected company if provided,
    // otherwise fall back to their assigned company
    return requestedCompanyId || getUserCompanyId(req);
};

// Get default follow-up date
const getDefaultFollowUpDate = (leadDate = new Date()) => {
    const followUpDate = new Date(leadDate);

    followUpDate.setDate(followUpDate.getDate() + 1);

    // Skip Sunday
    if (followUpDate.getDay() === 0) {
        followUpDate.setDate(followUpDate.getDate() + 1);
    }

    return followUpDate;
};

// Generate company-wise serial number
const getNextLeadSerialNumber = async (companyId) => {
    const highestLead = await Lead.findOne({
        company: companyId,
        serialNumber: { $type: "number" },
    })
        .sort({ serialNumber: -1 })
        .select("serialNumber")
        .lean();

    const highestNumber = Number(highestLead?.serialNumber || 0);

    let counter = await LeadCounter.findOne({
        company: companyId,
    });

    if (!counter) {
        try {
            counter = await LeadCounter.create({
                company: companyId,
                lastNumber: highestNumber,
            });
        } catch (error) {
            if (error.code !== 11000) {
                throw error;
            }

            counter = await LeadCounter.findOne({
                company: companyId,
            });
        }
    }

    if (!counter) {
        throw new Error("Could not initialize lead counter");
    }

    if (counter.lastNumber < highestNumber) {
        counter.lastNumber = highestNumber;
        await counter.save();
    }

    const updatedCounter = await LeadCounter.findOneAndUpdate(
        { company: companyId },
        { $inc: { lastNumber: 1 } },
        { new: true }
    );

    if (!updatedCounter) {
        throw new Error("Could not generate lead serial number");
    }

    return updatedCounter.lastNumber;
};

// GET LEADS
// GET LEADS
exports.getLeads = async (req, res) => {
    try {
        const {
            search = "",
            status,
            priority,
            inquiryType,
            assignedCounselor,
            startDate,
            endDate,
            page = 1,
            limit = 20,
            companyId,
        } = req.query;

        if (companyId && !mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        // Super Admin can view all companies or filter by companyId.
        // Employees/interns can select a company, but only see leads
        // of their own assigned company.
        const targetCompanyId = getTargetCompany(req, companyId);

        console.log("========== LEAD COMPANY DEBUG ==========");
        console.log("User ID:", req.user?._id?.toString());
        console.log("Role:", req.user?.role);
        console.log("Assigned Company:", getUserCompanyId(req));
        console.log("Requested Company:", companyId);
        console.log("Target Company:", targetCompanyId);
        console.log("========================================");

        if (req.user.role !== "super_admin" && !targetCompanyId) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to a company",
            });
        }

        // NEW: employee/intern selected a company that is not theirs -> 0 leads
        if (
            req.user.role !== "super_admin" &&
            companyId &&
            companyId.toString() !== getUserCompanyId(req)
        ) {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: Number(limit) || 20,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
                statusTotals: {
                    contacted: 0,
                    interested: 0,
                    enrolled: 0,
                    not_interested: 0,
                },
            });
        }

        if (targetCompanyId && !hasCompanyAccess(req, targetCompanyId)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this company",
            });
        }

        // No company condition means Super Admin sees all companies.
        const filter = {};

        if (targetCompanyId) {
            filter.company = targetCompanyId;
        }

        console.log("MongoDB Lead Filter:", filter);

        if (search.trim()) {
            filter.$or = [
                { fullName: { $regex: search.trim(), $options: "i" } },
                { contactNumber: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } },
                { city: { $regex: search.trim(), $options: "i" } },
                { courseInterested: { $regex: search.trim(), $options: "i" } },
            ];
        }

        if (status) {
            filter.status = status;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (inquiryType) {
            filter.inquiryType = inquiryType;
        }

        if (assignedCounselor) {
            filter.assignedCounselor = assignedCounselor;
        }

        if (startDate || endDate) {
            filter.leadDate = {};

            if (startDate) {
                filter.leadDate.$gte = new Date(`${startDate}T00:00:00`);
            }

            if (endDate) {
                filter.leadDate.$lte = new Date(`${endDate}T23:59:59.999`);
            }
        }

        const currentPage = Math.max(Number(page) || 1, 1);

        const pageLimit = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );

        const skip = (currentPage - 1) * pageLimit;

        // Build status totals using the same filters, excluding pagination.
        const statusCountFilter = { ...filter };

        if (targetCompanyId) {
            statusCountFilter.company =
                new mongoose.Types.ObjectId(targetCompanyId);
        }

        if (
            assignedCounselor &&
            mongoose.Types.ObjectId.isValid(assignedCounselor)
        ) {
            statusCountFilter.assignedCounselor =
                new mongoose.Types.ObjectId(assignedCounselor);
        }

        // Count each status regardless of the selected status filter.
        delete statusCountFilter.status;

        const [leads, total, statusCounts] = await Promise.all([
            Lead.find(filter)
                .populate("company", "companyName companyCode")
                .populate("assignedCounselor", "fullName email role")
                .populate("createdBy", "fullName email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageLimit),

            Lead.countDocuments(filter),

            Lead.aggregate([
                { $match: statusCountFilter },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const statusTotals = {
            contacted: 0,
            interested: 0,
            enrolled: 0,
            not_interested: 0,
        };

        statusCounts.forEach(({ _id, count }) => {
            if (Object.prototype.hasOwnProperty.call(statusTotals, _id)) {
                statusTotals[_id] = count;
            }
        });

        return res.status(200).json({
            success: true,
            data: leads,
            pagination: {
                total,
                page: currentPage,
                limit: pageLimit,
                totalPages: Math.ceil(total / pageLimit),
                hasNextPage: currentPage < Math.ceil(total / pageLimit),
                hasPreviousPage: currentPage > 1,
            },
            statusTotals,
        });
    } catch (error) {
        console.error("Get Leads Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch leads",
            error: error.message,
        });
    }
};




// CREATE LEAD
exports.createLead = async (req, res) => {
    try {
        const {
            company,
            fullName,
            contactNumber,
            email,
            city,
            leadDate,
            courseInterested,
            inquiryType,
            leadSource,
            assignedCounselor,
            priority,
            status,
            nextFollowUpDate,
            notes,
            expectedFees,
            admissionDate,
        } = req.body || {};

        if (
            typeof fullName !== "string" ||
            !fullName.trim() ||
            typeof contactNumber !== "string" ||
            !contactNumber.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name and contact number are required",
            });
        }

        let targetCompany;

        if (req.user.role === "super_admin") {
            if (!company) {
                return res.status(400).json({
                    success: false,
                    message: "Company is required",
                });
            }

            targetCompany = company;
        } else {
            const userCompanyId = getUserCompanyId(req);

            if (!userCompanyId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not assigned to a company",
                });
            }

            targetCompany = userCompanyId;
        }

        if (!mongoose.Types.ObjectId.isValid(targetCompany)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        if (!hasCompanyAccess(req, targetCompany)) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot create a lead for another company",
            });
        }

        if (assignedCounselor) {
            const assignedUser = await User.findOne({
                _id: assignedCounselor,
                company: targetCompany,
                role: { $in: ["employee", "intern"] },
                isActive: true,
            });

            if (!assignedUser) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive employee/intern for this company",
                });
            }
        }

        const actualLeadDate = leadDate
            ? new Date(leadDate)
            : new Date();

        if (Number.isNaN(actualLeadDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead date",
            });
        }

        let actualNextFollowUpDate = nextFollowUpDate
            ? new Date(nextFollowUpDate)
            : getDefaultFollowUpDate(actualLeadDate);

        if (
            Number.isNaN(actualNextFollowUpDate.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid next follow-up date",
            });
        }

        const serialNumber =
            await getNextLeadSerialNumber(targetCompany);

        const lead = await Lead.create({
            company: targetCompany,
            serialNumber,
            fullName: fullName.trim(),
            contactNumber: contactNumber.trim(),
            email: email?.trim() || undefined,
            city: city?.trim() || undefined,
            leadDate: actualLeadDate,
            courseInterested:
                courseInterested?.trim() || undefined,
            inquiryType: inquiryType || "course",
            leadSource: leadSource || "other",
            assignedCounselor: assignedCounselor || undefined,
            priority: priority || "medium",
            status: status || "contacted",
            nextFollowUpDate: actualNextFollowUpDate,
            notes: notes?.trim() || undefined,
            expectedFees:
                expectedFees !== undefined &&
                expectedFees !== ""
                    ? Number(expectedFees)
                    : undefined,
            admissionDate: admissionDate
                ? new Date(admissionDate)
                : undefined,
            createdBy: req.user._id,
        });

        const populatedLead = await Lead.findById(lead._id)
            .populate("company", "companyName companyCode")
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate("createdBy", "fullName email role");

        return res.status(201).json({
            success: true,
            message: "Lead created successfully",
            data: populatedLead,
        });
    } catch (error) {
        console.error("Create Lead Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create lead",
            error: error.message,
        });
    }
};

// UPDATE LEAD
exports.updateLead = async (req, res) => {
    try {
        const { leadId } = req.params;

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this lead",
            });
        }

        const {
            company,
            fullName,
            contactNumber,
            email,
            city,
            leadDate,
            courseInterested,
            inquiryType,
            leadSource,
            assignedCounselor,
            priority,
            status,
            nextFollowUpDate,
            notes,
            expectedFees,
            admissionDate,
        } = req.body || {};

        // Prevent moving a lead to a different company.
        if (
            company &&
            company.toString() !== lead.company.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "A lead cannot be moved to another company",
            });
        }

        if (
            fullName !== undefined &&
            (typeof fullName !== "string" || !fullName.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Full name cannot be empty",
            });
        }

        if (
            contactNumber !== undefined &&
            (
                typeof contactNumber !== "string" ||
                !contactNumber.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Contact number cannot be empty",
            });
        }

        if (assignedCounselor) {
            const assignedUser = await User.findOne({
                _id: assignedCounselor,
                company: lead.company,
                role: { $in: ["employee", "intern"] },
                isActive: true,
            });

            if (!assignedUser) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive employee/intern for this company",
                });
            }
        }

        const updates = {};

        if (fullName !== undefined) {
            updates.fullName = fullName.trim();
        }

        if (contactNumber !== undefined) {
            updates.contactNumber = contactNumber.trim();
        }

        if (email !== undefined) {
            updates.email = email.trim();
        }

        if (city !== undefined) {
            updates.city = city.trim();
        }

        if (leadDate !== undefined) {
            const parsedDate = new Date(leadDate);

            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid lead date",
                });
            }

            updates.leadDate = parsedDate;
        }

        if (courseInterested !== undefined) {
            updates.courseInterested = courseInterested.trim();
        }

        if (inquiryType !== undefined) {
            updates.inquiryType = inquiryType;
        }

        if (leadSource !== undefined) {
            updates.leadSource = leadSource;
        }

        if (assignedCounselor !== undefined) {
            updates.assignedCounselor =
                assignedCounselor || null;
        }

        if (priority !== undefined) {
            updates.priority = priority;
        }

        if (status !== undefined) {
            updates.status = status;
        }

        if (nextFollowUpDate !== undefined) {
            if (nextFollowUpDate === "" || nextFollowUpDate === null) {
                updates.nextFollowUpDate = null;
            } else {
                const parsedDate = new Date(nextFollowUpDate);

                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid next follow-up date",
                    });
                }

                updates.nextFollowUpDate = parsedDate;
            }
        }

        if (notes !== undefined) {
            updates.notes = notes.trim();
        }

        if (expectedFees !== undefined) {
            if (expectedFees === "" || expectedFees === null) {
                updates.expectedFees = null;
            } else {
                const fees = Number(expectedFees);

                if (!Number.isFinite(fees) || fees < 0) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Expected fees must be a valid non-negative number",
                    });
                }

                updates.expectedFees = fees;
            }
        }

        if (admissionDate !== undefined) {
            if (admissionDate === "" || admissionDate === null) {
                updates.admissionDate = null;
            } else {
                const parsedDate = new Date(admissionDate);

                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid admission date",
                    });
                }

                updates.admissionDate = parsedDate;
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid changes provided",
            });
        }

        const updatedLead = await Lead.findByIdAndUpdate(
            leadId,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("company", "companyName companyCode")
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate("createdBy", "fullName email role");

        return res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            data: updatedLead,
        });
    } catch (error) {
        console.error("Update Lead Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update lead",
            error: error.message,
        });
    }
};



// UPDATE LEAD STATUS
exports.updateLeadStatus = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { status } = req.body || {};

        const allowedStatuses = [
            "",
            "contacted",
            "interested",
            "not_interested",
            "enrolled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
                allowedStatuses,
            });
        }

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this lead",
            });
        }

        // Update only the status field.
        // Avoid lead.save(), which validates the entire document.
        const updatedLead = await Lead.findByIdAndUpdate(
            leadId,
            { $set: { status } },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate("company", "companyName companyCode");

        return res.status(200).json({
            success: true,
            message: "Lead status updated successfully",
            lead: updatedLead,
        });
    } catch (error) {
        console.error("Update Lead Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update lead status",
            error: error.message,
        });
    }
};

// ADD COMMUNICATION
exports.addCommunication = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { type, message, date } = req.body || {};

        const allowedTypes = [
            "call",
            "whatsapp",
            "email",
            "meeting",
        ];

        if (
            !type ||
            !allowedTypes.includes(type) ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid communication type and message are required",
            });
        }

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this lead",
            });
        }

        const communicationDate = date
            ? new Date(date)
            : new Date();

        if (
            Number.isNaN(communicationDate.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid communication date",
            });
        }

        // Update only communicationHistory.
        const updatedLead = await Lead.findByIdAndUpdate(
            leadId,
            {
                $push: {
                    communicationHistory: {
                        type,
                        message: message.trim(),
                        date: communicationDate,
                    },
                },
            },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate("company", "companyName companyCode");

        return res.status(200).json({
            success: true,
            message: "Communication added successfully",
            lead: updatedLead,
        });
    } catch (error) {
        console.error("Add Communication Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add communication",
            error: error.message,
        });
    }
};

// UPDATE COMMUNICATION
exports.updateCommunication = async (req, res) => {
    try {
        const { leadId, communicationId } = req.params;
        const { type, message, date } = req.body || {};

        const allowedTypes = [
            "call",
            "whatsapp",
            "email",
            "meeting",
        ];

        if (
            type !== undefined &&
            !allowedTypes.includes(type)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid communication type",
            });
        }

        if (
            message !== undefined &&
            (
                typeof message !== "string" ||
                !message.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Communication message cannot be empty",
            });
        }

        let communicationDate;

        if (date !== undefined) {
            communicationDate = new Date(date);

            if (
                Number.isNaN(communicationDate.getTime())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid communication date",
                });
            }
        }

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this lead",
            });
        }

        const communication =
            lead.communicationHistory.id(communicationId);

        if (!communication) {
            return res.status(404).json({
                success: false,
                message: "Communication record not found",
            });
        }

        const updates = {};

        if (type !== undefined) {
            updates["communicationHistory.$.type"] = type;
        }

        if (message !== undefined) {
            updates["communicationHistory.$.message"] =
                message.trim();
        }

        if (communicationDate !== undefined) {
            updates["communicationHistory.$.date"] =
                communicationDate;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No changes provided",
            });
        }

        const updatedLead = await Lead.findOneAndUpdate(
            {
                _id: leadId,
                "communicationHistory._id": communicationId,
            },
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate("company", "companyName companyCode");

        return res.status(200).json({
            success: true,
            message: "Communication updated successfully",
            lead: updatedLead,
        });
    } catch (error) {
        console.error("Update Communication Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update communication",
            error: error.message,
        });
    }
};



// DELETE COMMUNICATION
exports.deleteCommunication = async (req, res) => {
    try {
        const { leadId, communicationId } = req.params;

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this lead",
            });
        }

        const communicationExists =
            lead.communicationHistory.id(communicationId);

        if (!communicationExists) {
            return res.status(404).json({
                success: false,
                message: "Communication record not found",
            });
        }

        const updatedLead = await Lead.findByIdAndUpdate(
            leadId,
            {
                $pull: {
                    communicationHistory: {
                        _id: communicationId,
                    },
                },
            },
            { new: true }
        )
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate("company", "companyName companyCode");

        return res.status(200).json({
            success: true,
            message: "Communication deleted successfully",
            lead: updatedLead,
        });
    } catch (error) {
        console.error("Delete Communication Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete communication",
            error: error.message,
        });
    }
};

// DELETE LEAD
exports.deleteLead = async (req, res) => {
    try {
        const { leadId } = req.params;

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        // Ensure the user can only delete leads from their company.
        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this lead",
            });
        }

        await Lead.findByIdAndDelete(leadId);

        return res.status(200).json({
            success: true,
            message: "Lead deleted successfully",
            leadId,
        });
    } catch (error) {
        console.error("Delete Lead Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete lead",
            error: error.message,
        });
    }
};