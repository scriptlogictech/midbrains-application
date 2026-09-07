const Internship = require("../models/Internship");
const Admission = require("../models/Admission");
const User = require("../models/User");

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
// Create Internship
// ==========================================

exports.createInternship = async (req, res) => {
    try {
        const {
            company,
            admission,
            mentor,
            projectTitle,
            technology,
            duration,
            startDate,
            endDate,
            status,
            certificateGenerated,
            remarks,
        } = req.body || {};

        if (
            !company ||
            !admission ||
            !projectTitle ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, admission, project title, start date and end date are required",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (!hasCompanyAccess(req, company)) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot create an internship for another company",
            });
        }

        // ==========================================
        // Validate Admission
        // ==========================================

        const existingAdmission =
            await Admission.findById(admission);

        if (!existingAdmission) {
            return res.status(404).json({
                success: false,
                message: "Admission not found",
            });
        }

        // ==========================================
        // Admission Company Must Match
        // ==========================================

        if (
            existingAdmission.company.toString() !==
            company.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Admission does not belong to the selected company",
            });
        }

        // ==========================================
        // Validate Mentor
        // ==========================================

        if (mentor) {
            const existingMentor =
                await User.findOne({
                    _id: mentor,
                    company,
                    role: "trainer",
                    isActive: true,
                });

            if (!existingMentor) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive trainer selected as mentor",
                });
            }
        }

        // ==========================================
        // Prevent Duplicate Active Internship
        // ==========================================

        const existingInternship =
            await Internship.findOne({
                admission,
                status: {
                    $in: [
                        "assigned",
                        "in_progress",
                    ],
                },
            });

        if (existingInternship) {
            return res.status(400).json({
                success: false,
                message:
                    "An active internship already exists for this admission",
            });
        }

        // ==========================================
        // Create Internship
        // ==========================================

        const internship =
            await Internship.create({
                company,
                admission,
                mentor,
                projectTitle,
                technology,
                duration,
                startDate,
                endDate,
                status:
                    status || "assigned",
                certificateGenerated:
                    certificateGenerated !== undefined
                        ? certificateGenerated
                        : false,
                remarks,
                createdBy: req.user._id,
            });

        const populatedInternship =
            await Internship.findById(
                internship._id
            )
                .populate(
                    "admission",
                    "studentName contactNumber email courseName batchName"
                )
                .populate(
                    "mentor",
                    "fullName email role"
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
                "Internship created successfully",
            internship: populatedInternship,
        });
    } catch (error) {
        console.error(
            "Create Internship Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create internship",
            error: error.message,
        });
    }
};


// ==========================================
// Get All Internships
// ==========================================

exports.getInternships = async (req, res) => {
    try {
        let filter = {};

        // Non Super Admin → own company only
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

        const internships =
            await Internship.find(filter)
                .populate(
                    "admission",
                    "studentName contactNumber email courseName batchName"
                )
                .populate(
                    "mentor",
                    "fullName email role"
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
            internships,
        });
    } catch (error) {
        console.error(
            "Get Internships Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch internships",
            error: error.message,
        });
    }
};


// ==========================================
// Get Company Internships
// ==========================================

exports.getCompanyInternships = async (
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

        const internships =
            await Internship.find({
                company: companyId,
            })
                .populate(
                    "admission",
                    "studentName contactNumber email courseName batchName"
                )
                .populate(
                    "mentor",
                    "fullName email role"
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
            internships,
        });
    } catch (error) {
        console.error(
            "Get Company Internships Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch company internships",
            error: error.message,
        });
    }
};


// ==========================================
// Update Internship Status
// ==========================================

exports.updateInternshipStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required",
            });
        }

        const internship =
            await Internship.findById(id);

        if (!internship) {
            return res.status(404).json({
                success: false,
                message: "Internship not found",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (
            !hasCompanyAccess(
                req,
                internship.company
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this internship",
            });
        }

        // ==========================================
        // Validate Status
        // ==========================================

        const allowedStatuses = [
            "assigned",
            "in_progress",
            "completed",
            "cancelled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid internship status",
            });
        }

        internship.status = status;

        await internship.save();

        const updatedInternship =
            await Internship.findById(
                internship._id
            )
                .populate(
                    "admission",
                    "studentName contactNumber email courseName batchName"
                )
                .populate(
                    "mentor",
                    "fullName email role"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                );

        res.status(200).json({
            success: true,
            message:
                "Internship status updated successfully",
            internship: updatedInternship,
        });
    } catch (error) {
        console.error(
            "Update Internship Status Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update internship status",
            error: error.message,
        });
    }
};