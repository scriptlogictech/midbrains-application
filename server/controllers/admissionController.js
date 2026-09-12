const Admission = require("../models/Admission");
const Lead = require("../models/Lead");

// ==========================================
// Helper: Check Company Access
// ==========================================

const hasCompanyAccess = (req, companyId) => {
    if (!req.user || !companyId) {
        return false;
    }

    // Super Admin can access all companies
    if (req.user.role === "super_admin") {
        return true;
    }

    // Employee can access only their own company
    return (
        req.user.company &&
        req.user.company.toString() ===
            companyId.toString()
    );
};

// ==========================================
// Helper: Get Target Company
// ==========================================

const getTargetCompany = (req, requestedCompany) => {
    // Super Admin can use selected company
    if (req.user.role === "super_admin") {
        return requestedCompany || null;
    }

    // Employee must always use their own company
    if (req.user.company) {
        return req.user.company;
    }

    return null;
};

// ==========================================
// Create Admission
// ==========================================

exports.createAdmission = async (req, res) => {
    try {
        const {
            company,
            lead,
            studentName,
            contactNumber,
            email,
            courseName,
            batchName,
            fees,
            paidAmount,
            paymentStatus,
            internshipAssigned,
            placementSupport,
            admissionDate,
            remarks,
        } = req.body || {};

        // ==========================================
        // Validate Required Fields
        // ==========================================

        if (
            !lead ||
            !studentName ||
            !contactNumber ||
            !courseName ||
            !batchName ||
            fees === undefined ||
            fees === null
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Lead, student name, contact number, course name, batch name and fees are required",
            });
        }

        // ==========================================
        // Determine Company
        // ==========================================

        const targetCompany = getTargetCompany(
            req,
            company
        );

        if (!targetCompany) {
            return res.status(400).json({
                success: false,
                message: "Company is required",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (
            !hasCompanyAccess(
                req,
                targetCompany
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot create an admission for another company",
            });
        }

        // ==========================================
        // Validate Lead
        // ==========================================

        const existingLead =
            await Lead.findOne({
                _id: lead,
                company: targetCompany,
            });

        if (!existingLead) {
            return res.status(404).json({
                success: false,
                message:
                    "Lead not found for this company",
            });
        }

        // ==========================================
        // Lead Must Be Converted
        // ==========================================

        if (
            existingLead.status !==
            "converted"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only converted leads can be admitted",
            });
        }

        // ==========================================
        // Prevent Duplicate Admission
        // ==========================================

        const existingAdmission =
            await Admission.findOne({
                lead,
            });

        if (existingAdmission) {
            return res.status(400).json({
                success: false,
                message:
                    "An admission already exists for this lead",
            });
        }

        // ==========================================
        // Create Admission
        // ==========================================

        const admission =
            await Admission.create({
                company: targetCompany,
                lead,
                studentName:
                    studentName.trim(),
                contactNumber:
                    contactNumber.trim(),
                email: email
                    ? email.trim().toLowerCase()
                    : undefined,
                courseName,
                batchName,
                fees,
                paidAmount:
                    paidAmount !== undefined
                        ? paidAmount
                        : 0,
                paymentStatus:
                    paymentStatus ||
                    "pending",
                internshipAssigned:
                    internshipAssigned !==
                    undefined
                        ? internshipAssigned
                        : false,
                placementSupport:
                    placementSupport !==
                    undefined
                        ? placementSupport
                        : true,
                admissionDate:
                    admissionDate ||
                    Date.now(),
                remarks,
                createdBy: req.user._id,
            });

        // ==========================================
        // Populate Response
        // ==========================================

        const populatedAdmission =
            await Admission.findById(
                admission._id
            )
                .populate(
                    "lead",
                    "fullName contactNumber email status courseInterested"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                )
                .populate(
                    "createdBy",
                    "fullName email role"
                );

        return res.status(201).json({
            success: true,
            message:
                "Admission created successfully",
            admission:
                populatedAdmission,
        });
    } catch (error) {
        console.error(
            "Create Admission Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create admission",
            error: error.message,
        });
    }
};

// ==========================================
// Get All Admissions
// ==========================================

exports.getAdmissions = async (
    req,
    res
) => {
    try {
        let filter = {};

        // ==========================================
        // Non Super Admin → Own Company Only
        // ==========================================

        if (
            req.user.role !==
            "super_admin"
        ) {
            if (!req.user.company) {
                return res.status(403).json({
                    success: false,
                    message:
                        "User is not assigned to a company",
                });
            }

            filter.company =
                req.user.company;
        }

        const admissions =
            await Admission.find(
                filter
            )
                .populate(
                    "lead",
                    "fullName contactNumber email status courseInterested"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                )
                .populate(
                    "createdBy",
                    "fullName email role"
                )
                .sort({
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            admissions,
        });
    } catch (error) {
        console.error(
            "Get Admissions Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch admissions",
            error: error.message,
        });
    }
};

// ==========================================
// Get Company Admissions
// ==========================================

exports.getCompanyAdmissions =
    async (req, res) => {
        try {
            const { companyId } =
                req.params;

            if (
                !companyId
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Company ID is required",
                });
            }

            if (
                !hasCompanyAccess(
                    req,
                    companyId
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have access to this company",
                });
            }

            const admissions =
                await Admission.find({
                    company: companyId,
                })
                    .populate(
                        "lead",
                        "fullName contactNumber email status courseInterested"
                    )
                    .populate(
                        "company",
                        "companyName companyCode"
                    )
                    .populate(
                        "createdBy",
                        "fullName email role"
                    )
                    .sort({
                        createdAt: -1,
                    });

            return res.status(200).json({
                success: true,
                admissions,
            });
        } catch (error) {
            console.error(
                "Get Company Admissions Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch company admissions",
                error: error.message,
            });
        }
    };

// ==========================================
// Get Admission By ID
// ==========================================

exports.getAdmissionById =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const admission =
                await Admission.findById(
                    id
                )
                    .populate(
                        "lead",
                        "fullName contactNumber email status courseInterested"
                    )
                    .populate(
                        "company",
                        "companyName companyCode"
                    )
                    .populate(
                        "createdBy",
                        "fullName email role"
                    );

            if (!admission) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Admission not found",
                });
            }

            // ==========================================
            // Company Access
            // ==========================================

            if (
                !hasCompanyAccess(
                    req,
                    admission.company._id
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have access to this admission",
                });
            }

            return res.status(200).json({
                success: true,
                admission,
            });
        } catch (error) {
            console.error(
                "Get Admission Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch admission",
                error: error.message,
            });
        }
    };

// ==========================================
// Update Admission
// ==========================================

exports.updateAdmission =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const admission =
                await Admission.findById(
                    id
                );

            if (!admission) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Admission not found",
                });
            }

            // ==========================================
            // Company Access
            // ==========================================

            if (
                !hasCompanyAccess(
                    req,
                    admission.company
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have access to this admission",
                });
            }

            const {
                studentName,
                contactNumber,
                email,
                courseName,
                batchName,
                fees,
                paidAmount,
                paymentStatus,
                internshipAssigned,
                placementSupport,
                admissionDate,
                remarks,
            } = req.body || {};

            // ==========================================
            // Update Fields
            // ==========================================

            if (
                studentName !==
                undefined
            ) {
                admission.studentName =
                    studentName.trim();
            }

            if (
                contactNumber !==
                undefined
            ) {
                admission.contactNumber =
                    contactNumber.trim();
            }

            if (email !== undefined) {
                admission.email = email
                    ? email
                          .trim()
                          .toLowerCase()
                    : "";
            }

            if (
                courseName !==
                undefined
            ) {
                admission.courseName =
                    courseName;
            }

            if (
                batchName !==
                undefined
            ) {
                admission.batchName =
                    batchName;
            }

            if (fees !== undefined) {
                admission.fees = fees;
            }

            if (
                paidAmount !==
                undefined
            ) {
                admission.paidAmount =
                    paidAmount;
            }

            if (
                paymentStatus !==
                undefined
            ) {
                admission.paymentStatus =
                    paymentStatus;
            }

            if (
                internshipAssigned !==
                undefined
            ) {
                admission.internshipAssigned =
                    internshipAssigned;
            }

            if (
                placementSupport !==
                undefined
            ) {
                admission.placementSupport =
                    placementSupport;
            }

            if (
                admissionDate !==
                undefined
            ) {
                admission.admissionDate =
                    admissionDate;
            }

            if (remarks !== undefined) {
                admission.remarks =
                    remarks;
            }

            const updatedAdmission =
                await admission.save();

            // ==========================================
            // Populate Response
            // ==========================================

            const populatedAdmission =
                await Admission.findById(
                    updatedAdmission._id
                )
                    .populate(
                        "lead",
                        "fullName contactNumber email status courseInterested"
                    )
                    .populate(
                        "company",
                        "companyName companyCode"
                    )
                    .populate(
                        "createdBy",
                        "fullName email role"
                    );

            return res.status(200).json({
                success: true,
                message:
                    "Admission updated successfully",
                admission:
                    populatedAdmission,
            });
        } catch (error) {
            console.error(
                "Update Admission Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update admission",
                error: error.message,
            });
        }
    };

// ==========================================
// Delete Admission
// ==========================================

exports.deleteAdmission =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const admission =
                await Admission.findById(
                    id
                );

            if (!admission) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Admission not found",
                });
            }

            // ==========================================
            // Company Access
            // ==========================================

            if (
                !hasCompanyAccess(
                    req,
                    admission.company
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You do not have access to this admission",
                });
            }

            await Admission.findByIdAndDelete(
                id
            );

            return res.status(200).json({
                success: true,
                message:
                    "Admission deleted successfully",
            });
        } catch (error) {
            console.error(
                "Delete Admission Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to delete admission",
                error: error.message,
            });
        }
    };