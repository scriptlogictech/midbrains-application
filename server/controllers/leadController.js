const Lead = require("../models/Lead");
const User = require("../models/User");

// ============================================================
// HELPER: CHECK COMPANY ACCESS
// ============================================================

const hasCompanyAccess = (req, companyId) => {
    if (!req.user || !companyId) {
        return false;
    }

    // Super Admin can access all companies
    if (req.user.role === "super_admin") {
        return true;
    }

    // Employee / Intern can access only their own company
    if (!req.user.company) {
        return false;
    }

    return (
        req.user.company.toString() ===
        companyId.toString()
    );
};

// ============================================================
// HELPER: GET TARGET COMPANY
// ============================================================

const getTargetCompany = (req, requestedCompanyId) => {
    // Super Admin can work with selected company
    if (req.user.role === "super_admin") {
        return requestedCompanyId || null;
    }

    // Employee / Intern must always use their own company
    if (req.user.company) {
        return req.user.company;
    }

    return null;
};

// ============================================================
// GET LEADS
// ============================================================

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

        // --------------------------------------------------------
        // DETERMINE COMPANY
        // --------------------------------------------------------

        const targetCompanyId = getTargetCompany(
            req,
            companyId
        );

        if (!targetCompanyId) {
            return res.status(400).json({
                success: false,
                message: "Company ID is required",
            });
        }

        // --------------------------------------------------------
        // COMPANY ACCESS
        // --------------------------------------------------------

        if (
            !hasCompanyAccess(
                req,
                targetCompanyId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this company",
            });
        }

        // --------------------------------------------------------
        // BASE FILTER
        // --------------------------------------------------------

        const filter = {
            company: targetCompanyId,
        };

        // --------------------------------------------------------
        // SEARCH
        // --------------------------------------------------------

        if (search.trim()) {
            filter.$or = [
                {
                    fullName: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    contactNumber: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    city: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
                {
                    courseInterested: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ];
        }

        // --------------------------------------------------------
        // STATUS FILTER
        // --------------------------------------------------------

        if (status) {
            filter.status = status;
        }

        // --------------------------------------------------------
        // PRIORITY FILTER
        // --------------------------------------------------------

        if (priority) {
            filter.priority = priority;
        }

        // --------------------------------------------------------
        // INQUIRY TYPE FILTER
        // --------------------------------------------------------

        if (inquiryType) {
            filter.inquiryType = inquiryType;
        }

        // --------------------------------------------------------
        // ASSIGNED EMPLOYEE / INTERN FILTER
        // --------------------------------------------------------

        if (assignedCounselor) {
            filter.assignedCounselor =
                assignedCounselor;
        }

        // --------------------------------------------------------
        // DATE FILTER
        // --------------------------------------------------------

        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(
                    `${startDate}T00:00:00`
                );
            }

            if (endDate) {
                filter.createdAt.$lte = new Date(
                    `${endDate}T23:59:59.999`
                );
            }
        }

        // --------------------------------------------------------
        // PAGINATION
        // --------------------------------------------------------

        const currentPage = Math.max(
            Number(page),
            1
        );

        const pageLimit = Math.min(
            Math.max(Number(limit), 1),
            100
        );

        const skip =
            (currentPage - 1) * pageLimit;

        // --------------------------------------------------------
        // FETCH LEADS
        // --------------------------------------------------------

        const [leads, total] =
            await Promise.all([
                Lead.find(filter)
                    .populate(
                        "company",
                        "companyName companyCode"
                    )
                    .populate(
                        "assignedCounselor",
                        "fullName email role"
                    )
                    .populate(
                        "createdBy",
                        "fullName email role"
                    )
                    .sort({
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(pageLimit),

                Lead.countDocuments(filter),
            ]);

        // --------------------------------------------------------
        // RESPONSE
        // --------------------------------------------------------

        return res.status(200).json({
            success: true,
            data: leads,
            pagination: {
                total,
                page: currentPage,
                limit: pageLimit,
                totalPages:
                    Math.ceil(
                        total / pageLimit
                    ),
                hasNextPage:
                    currentPage <
                    Math.ceil(
                        total / pageLimit
                    ),
                hasPreviousPage:
                    currentPage > 1,
            },
        });
    } catch (error) {
        console.error(
            "Get Leads Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch leads",
            error: error.message,
        });
    }
};

// ============================================================
// CREATE LEAD
// ============================================================

exports.createLead = async (req, res) => {
    try {
        const {
            company,
            fullName,
            contactNumber,
            email,
            city,
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

        // --------------------------------------------------------
        // REQUIRED FIELDS
        // --------------------------------------------------------

        if (
            !fullName ||
            !contactNumber
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name and contact number are required",
            });
        }

        // --------------------------------------------------------
        // DETERMINE COMPANY
        // --------------------------------------------------------

        let targetCompany;

        if (req.user.role === "super_admin") {
            // Super Admin must provide company
            if (!company) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Company is required",
                });
            }

            targetCompany = company;
        } else {
            // Employee / Intern automatically use own company
            if (!req.user.company) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not assigned to a company",
                });
            }

            targetCompany = req.user.company;
        }

        // --------------------------------------------------------
        // COMPANY ACCESS
        // --------------------------------------------------------

        if (
            !hasCompanyAccess(
                req,
                targetCompany
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot create a lead for another company",
            });
        }

        // --------------------------------------------------------
        // ASSIGNED EMPLOYEE / INTERN VALIDATION
        // --------------------------------------------------------

        if (assignedCounselor) {
            const assignedUser =
                await User.findOne({
                    _id: assignedCounselor,
                    company: targetCompany,
                    role: {
                        $in: [
                            "employee",
                            "intern",
                        ],
                    },
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

        // --------------------------------------------------------
        // CREATE LEAD
        // --------------------------------------------------------

        const lead = await Lead.create({
            company: targetCompany,
            fullName: fullName.trim(),
            contactNumber:
                contactNumber.trim(),
            email: email
                ? email.trim().toLowerCase()
                : undefined,
            city,
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
            createdBy: req.user._id,
        });

        // --------------------------------------------------------
        // POPULATE CREATED LEAD
        // --------------------------------------------------------

        const populatedLead =
            await Lead.findById(
                lead._id
            )
                .populate(
                    "assignedCounselor",
                    "fullName email role"
                )
                .populate(
                    "createdBy",
                    "fullName email role"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                );

        return res.status(201).json({
            success: true,
            message:
                "Lead created successfully",
            lead: populatedLead,
        });
    } catch (error) {
        console.error(
            "Create Lead Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create lead",
            error: error.message,
        });
    }
};

// ============================================================
// UPDATE LEAD
// ============================================================

exports.updateLead = async (req, res) => {
    try {
        const { leadId } =
            req.params;

        const lead =
            await Lead.findById(
                leadId
            );

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        // --------------------------------------------------------
        // COMPANY ACCESS
        // --------------------------------------------------------

        if (
            !hasCompanyAccess(
                req,
                lead.company
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this lead",
            });
        }

        const {
            fullName,
            contactNumber,
            email,
            city,
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

        // --------------------------------------------------------
        // ASSIGNED EMPLOYEE / INTERN VALIDATION
        // --------------------------------------------------------

        if (assignedCounselor) {
            const assignedUser =
                await User.findOne({
                    _id: assignedCounselor,
                    company: lead.company,
                    role: {
                        $in: [
                            "employee",
                            "intern",
                        ],
                    },
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

        // --------------------------------------------------------
        // UPDATE DATA
        // --------------------------------------------------------

        const updateData = {};

        if (fullName !== undefined) {
            updateData.fullName =
                fullName.trim();
        }

        if (
            contactNumber !==
            undefined
        ) {
            updateData.contactNumber =
                contactNumber.trim();
        }

        if (email !== undefined) {
            updateData.email = email
                ? email.trim().toLowerCase()
                : "";
        }

        if (city !== undefined) {
            updateData.city = city;
        }

        if (
            courseInterested !==
            undefined
        ) {
            updateData.courseInterested =
                courseInterested;
        }

        if (
            inquiryType !==
            undefined
        ) {
            updateData.inquiryType =
                inquiryType;
        }

        if (
            leadSource !==
            undefined
        ) {
            updateData.leadSource =
                leadSource;
        }

        if (
            assignedCounselor !==
            undefined
        ) {
            updateData.assignedCounselor =
                assignedCounselor;
        }

        if (
            priority !== undefined
        ) {
            updateData.priority =
                priority;
        }

        if (status !== undefined) {
            updateData.status =
                status;
        }

        if (
            nextFollowUpDate !==
            undefined
        ) {
            updateData.nextFollowUpDate =
                nextFollowUpDate;
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        if (
            expectedFees !==
            undefined
        ) {
            updateData.expectedFees =
                expectedFees;
        }

        if (
            admissionDate !==
            undefined
        ) {
            updateData.admissionDate =
                admissionDate;
        }

        // --------------------------------------------------------
        // UPDATE LEAD
        // --------------------------------------------------------

        const updatedLead =
            await Lead.findByIdAndUpdate(
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
                .populate(
                    "createdBy",
                    "fullName email role"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                );

        return res.status(200).json({
            success: true,
            message:
                "Lead updated successfully",
            lead: updatedLead,
        });
    } catch (error) {
        console.error(
            "Update Lead Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update lead",
            error: error.message,
        });
    }
};

// ============================================================
// UPDATE LEAD STATUS
// ============================================================

exports.updateLeadStatus =
    async (req, res) => {
        try {
            const { leadId } =
                req.params;

            const { status } =
                req.body || {};

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Status is required",
                });
            }

            const lead =
                await Lead.findById(
                    leadId
                );

            if (!lead) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Lead not found",
                });
            }

            // ----------------------------------------------------
            // COMPANY ACCESS
            // ----------------------------------------------------

            if (
                !hasCompanyAccess(
                    req,
                    lead.company
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have access to this lead",
                });
            }

            lead.status = status;

            await lead.save();

            const updatedLead =
                await Lead.findById(
                    lead._id
                )
                    .populate(
                        "assignedCounselor",
                        "fullName email role"
                    )
                    .populate(
                        "company",
                        "companyName companyCode"
                    );

            return res.status(200).json({
                success: true,
                message:
                    "Lead status updated successfully",
                lead: updatedLead,
            });
        } catch (error) {
            console.error(
                "Update Lead Status Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update lead status",
                error: error.message,
            });
        }
    };

// ============================================================
// ADD COMMUNICATION
// ============================================================

exports.addCommunication =
    async (req, res) => {
        try {
            const { leadId } =
                req.params;

            const {
                type,
                message,
                date,
            } = req.body || {};

            if (
                !type ||
                !message
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Communication type and message are required",
                });
            }

            const lead =
                await Lead.findById(
                    leadId
                );

            if (!lead) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Lead not found",
                });
            }

            // ----------------------------------------------------
            // COMPANY ACCESS
            // ----------------------------------------------------

            if (
                !hasCompanyAccess(
                    req,
                    lead.company
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have access to this lead",
                });
            }

            lead.communicationHistory.push(
                {
                    type,
                    message,
                    date:
                        date ||
                        Date.now(),
                }
            );

            await lead.save();

            const updatedLead =
                await Lead.findById(
                    lead._id
                )
                    .populate(
                        "assignedCounselor",
                        "fullName email role"
                    )
                    .populate(
                        "company",
                        "companyName companyCode"
                    );

            return res.status(200).json({
                success: true,
                message:
                    "Communication added successfully",
                lead: updatedLead,
            });
        } catch (error) {
            console.error(
                "Add Communication Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to add communication",
                error: error.message,
            });
        }
    };