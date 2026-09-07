const Admission = require("../models/Admission");
const Lead = require("../models/Lead");

// ==========================================
// Helper: Check Company Access
// ==========================================

const hasCompanyAccess = (req, companyId) => {
    if (!req.user) {
        return false;
    }

    // Super Admin can access all companies
    if (req.user.role === "super_admin") {
        return true;
    }

    return (
        req.user.company &&
        req.user.company.toString() ===
            companyId.toString()
    );
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

        if (
            !company ||
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
                    "Company, lead, student name, contact number, course name, batch name and fees are required",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (!hasCompanyAccess(req, company)) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot create an admission for another company",
            });
        }

        // ==========================================
        // Validate Lead
        // ==========================================

        const existingLead = await Lead.findById(lead);

        if (!existingLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        // ==========================================
        // Lead Company Must Match Admission Company
        // ==========================================

        if (
            existingLead.company.toString() !==
            company.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Lead does not belong to the selected company",
            });
        }

        // ==========================================
        // Lead Must Be Converted
        // ==========================================

        if (existingLead.status !== "converted") {
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

        const admission = await Admission.create({
            company,
            lead,
            studentName,
            contactNumber,
            email,
            courseName,
            batchName,
            fees,
            paidAmount:
                paidAmount !== undefined
                    ? paidAmount
                    : 0,
            paymentStatus:
                paymentStatus || "pending",
            internshipAssigned:
                internshipAssigned !== undefined
                    ? internshipAssigned
                    : false,
            placementSupport:
                placementSupport !== undefined
                    ? placementSupport
                    : true,
            admissionDate:
                admissionDate || Date.now(),
            remarks,
            createdBy: req.user._id,
        });

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

        res.status(201).json({
            success: true,
            message:
                "Admission created successfully",
            admission: populatedAdmission,
        });
    } catch (error) {
        console.error(
            "Create Admission Error:",
            error
        );

        res.status(500).json({
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

exports.getAdmissions = async (req, res) => {
    try {
        let filter = {};

        // ==========================================
        // Non Super Admin → Own Company Only
        // ==========================================

        if (req.user.role !== "super_admin") {
            if (!req.user.company) {
                return res.status(403).json({
                    success: false,
                    message:
                        "User is not assigned to a company",
                });
            }

            filter.company = req.user.company;
        }

        const admissions =
            await Admission.find(filter)
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

        res.status(200).json({
            success: true,
            admissions,
        });
    } catch (error) {
        console.error(
            "Get Admissions Error:",
            error
        );

        res.status(500).json({
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

exports.getCompanyAdmissions = async (
    req,
    res
) => {
    try {
        const { companyId } = req.params;

        if (!hasCompanyAccess(req, companyId)) {
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

        res.status(200).json({
            success: true,
            admissions,
        });
    } catch (error) {
        console.error(
            "Get Company Admissions Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch company admissions",
            error: error.message,
        });
    }
};