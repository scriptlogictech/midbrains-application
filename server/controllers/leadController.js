
const Lead = require("../models/Lead");
const User = require("../models/User");
const LeadCounter = require("../models/LeadCounter");

// Get the logged-in user's company ID
const getUserCompanyId = (req) => {
    if (!req.user || !req.user.company) {
        return null;
    }

    if (req.user.company._id) {
        return req.user.company._id.toString();
    }

    return req.user.company.toString();
};

// Check company access
const hasCompanyAccess = (req, companyId) => {
    if (!req.user || !companyId) {
        return false;
    }

    if (req.user.role === "super_admin") {
        return true;
    }

    const userCompanyId = getUserCompanyId(req);

    if (!userCompanyId) {
        return false;
    }

    return userCompanyId === companyId.toString();
};

// Get target company
const getTargetCompany = (req, requestedCompanyId) => {
    if (req.user.role === "super_admin") {
        return requestedCompanyId || null;
    }

    const userCompanyId = getUserCompanyId(req);

    return userCompanyId || null;
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

        const targetCompanyId = getTargetCompany(req, companyId);

        if (!targetCompanyId) {
            return res.status(400).json({
                success: false,
                message: "Company ID is required",
            });
        }

        if (!hasCompanyAccess(req, targetCompanyId)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this company",
            });
        }

        const filter = {
            company: targetCompanyId,
        };

        if (search.trim()) {
            filter.$or = [
                { fullName: { $regex: search.trim(), $options: "i" } },
                { contactNumber: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } },
                { city: { $regex: search.trim(), $options: "i" } },
                {
                    courseInterested: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (inquiryType) filter.inquiryType = inquiryType;

        if (assignedCounselor) {
            filter.assignedCounselor = assignedCounselor;
        }

        if (startDate || endDate) {
            filter.leadDate = {};

            if (startDate) {
                filter.leadDate.$gte = new Date(
                    `${startDate}T00:00:00`
                );
            }

            if (endDate) {
                filter.leadDate.$lte = new Date(
                    `${endDate}T23:59:59.999`
                );
            }
        }

        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.min(
            Math.max(Number(limit) || 20, 1),
            100
        );
        const skip = (currentPage - 1) * pageLimit;

        const [leads, total] = await Promise.all([
            Lead.find(filter)
                .populate("company", "companyName companyCode")
                .populate(
                    "assignedCounselor",
                    "fullName email role"
                )
                .populate(
                    "createdBy",
                    "fullName email role"
                )

                // UPDATED: Newest-created leads appear first
                .sort({ createdAt: -1 })

                .skip(skip)
                .limit(pageLimit),

            Lead.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: leads,
            pagination: {
                total,
                page: currentPage,
                limit: pageLimit,
                totalPages: Math.ceil(total / pageLimit),
                hasNextPage:
                    currentPage < Math.ceil(total / pageLimit),
                hasPreviousPage: currentPage > 1,
            },
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

        const actualNextFollowUpDate = nextFollowUpDate
            ? new Date(nextFollowUpDate)
            : getDefaultFollowUpDate(actualLeadDate);

        if (
            Number.isNaN(actualNextFollowUpDate.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid follow-up date",
            });
        }

        const serialNumber =
            await getNextLeadSerialNumber(targetCompany);

        const lead = await Lead.create({
            company: targetCompany,
            serialNumber,
            fullName: fullName.trim(),
            contactNumber: contactNumber.trim(),
            email: email
                ? email.trim().toLowerCase()
                : undefined,
            city,
            leadDate: actualLeadDate,
            courseInterested,
            inquiryType,
            leadSource,
            assignedCounselor,
            priority,
            status: status ?? "",
            nextFollowUpDate: actualNextFollowUpDate,
            notes,
            expectedFees,
            admissionDate,
            createdBy: req.user._id,
        });

        const populatedLead = await Lead.findById(lead._id)
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate("createdBy", "fullName email role")
            .populate("company", "companyName companyCode");

        return res.status(201).json({
            success: true,
            message: "Lead created successfully",
            lead: populatedLead,
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

        const updateData = {};

        if (fullName !== undefined) {
            if (
                typeof fullName !== "string" ||
                !fullName.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Full name cannot be empty",
                });
            }

            updateData.fullName = fullName.trim();
        }

        if (contactNumber !== undefined) {
            if (
                typeof contactNumber !== "string" ||
                !contactNumber.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Contact number cannot be empty",
                });
            }

            updateData.contactNumber = contactNumber.trim();
        }

        if (email !== undefined) {
            updateData.email = email
                ? email.trim().toLowerCase()
                : "";
        }

        if (city !== undefined) updateData.city = city;
        if (leadDate !== undefined) {
            updateData.leadDate = leadDate;
        }
        if (courseInterested !== undefined) {
            updateData.courseInterested = courseInterested;
        }
        if (inquiryType !== undefined) {
            updateData.inquiryType = inquiryType;
        }
        if (leadSource !== undefined) {
            updateData.leadSource = leadSource;
        }
        if (assignedCounselor !== undefined) {
            updateData.assignedCounselor = assignedCounselor;
        }
        if (priority !== undefined) {
            updateData.priority = priority;
        }

        if (status !== undefined) {
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

            updateData.status = status;
        }

        if (notes !== undefined) updateData.notes = notes;
        if (expectedFees !== undefined) {
            updateData.expectedFees = expectedFees;
        }
        if (admissionDate !== undefined) {
            updateData.admissionDate = admissionDate;
        }

        if (nextFollowUpDate !== undefined) {
            if (nextFollowUpDate) {
                const parsedDate = new Date(nextFollowUpDate);

                if (Number.isNaN(parsedDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid follow-up date",
                    });
                }

                updateData.nextFollowUpDate = parsedDate;
            } else {
                const baseDate =
                    leadDate !== undefined
                        ? new Date(leadDate)
                        : lead.leadDate ||
                          lead.createdAt ||
                          new Date();

                updateData.nextFollowUpDate =
                    getDefaultFollowUpDate(baseDate);
            }
        }

        const updatedLead = await Lead.findByIdAndUpdate(
            leadId,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        )
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate("createdBy", "fullName email role")
            .populate("company", "companyName companyCode");

        return res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            lead: updatedLead,
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

        if (
            status === undefined ||
            status === null ||
            typeof status !== "string" ||
            !allowedStatuses.includes(status)
        ) {
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
