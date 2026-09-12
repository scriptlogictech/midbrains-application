const Internship = require("../models/Internship");
const Admission = require("../models/Admission");
const User = require("../models/User");

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
    // Super Admin can select any company
    if (req.user.role === "super_admin") {
        return requestedCompany || null;
    }

    // Employee automatically uses their own company
    if (req.user.company) {
        return req.user.company;
    }

    return null;
};

// ==========================================
// Helper: Populate Internship
// ==========================================

const populateInternship = (query) => {
    return query
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

        // ==========================================
        // Required Fields
        // ==========================================

        if (
            !admission ||
            !projectTitle ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Admission, project title, start date and end date are required",
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
            !existingAdmission.company ||
            existingAdmission.company.toString() !==
                targetCompany.toString()
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
                    company: targetCompany,
                    role: "employee",
                    isActive: true,
                });

            if (!existingMentor) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive employee selected as mentor",
                });
            }
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

        if (
            status &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid internship status",
            });
        }

        // ==========================================
        // Prevent Duplicate Active Internship
        // ==========================================

        const existingInternship =
            await Internship.findOne({
                admission,
                company: targetCompany,
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
                company: targetCompany,
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
                    certificateGenerated !==
                    undefined
                        ? certificateGenerated
                        : false,
                remarks,
                createdBy: req.user._id,
            });

        // ==========================================
        // Get Populated Internship
        // ==========================================

        const populatedInternship =
            await populateInternship(
                Internship.findById(
                    internship._id
                )
            );

        return res.status(201).json({
            success: true,
            message:
                "Internship created successfully",
            internship:
                populatedInternship,
        });
    } catch (error) {
        console.error(
            "Create Internship Error:",
            error
        );

        return res.status(500).json({
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

        // ==========================================
        // Employee → Own Company Only
        // ==========================================

        if (req.user.role !== "super_admin") {
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

        const internships =
            await populateInternship(
                Internship.find(filter).sort({
                    createdAt: -1,
                })
            );

        return res.status(200).json({
            success: true,
            internships,
        });
    } catch (error) {
        console.error(
            "Get Internships Error:",
            error
        );

        return res.status(500).json({
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

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message:
                    "Company ID is required",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

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

        const internships =
            await populateInternship(
                Internship.find({
                    company: companyId,
                }).sort({
                    createdAt: -1,
                })
            );

        return res.status(200).json({
            success: true,
            internships,
        });
    } catch (error) {
        console.error(
            "Get Company Internships Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch company internships",
            error: error.message,
        });
    }
};

// ==========================================
// Get Internship By ID
// ==========================================

exports.getInternshipById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const internship =
            await Internship.findById(id);

        if (!internship) {
            return res.status(404).json({
                success: false,
                message:
                    "Internship not found",
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

        const populatedInternship =
            await populateInternship(
                Internship.findById(id)
            );

        return res.status(200).json({
            success: true,
            internship:
                populatedInternship,
        });
    } catch (error) {
        console.error(
            "Get Internship By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch internship",
            error: error.message,
        });
    }
};

// ==========================================
// Update Internship
// ==========================================

exports.updateInternship = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

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

        const internship =
            await Internship.findById(id);

        if (!internship) {
            return res.status(404).json({
                success: false,
                message:
                    "Internship not found",
            });
        }

        // ==========================================
        // Existing Internship Company Access
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
        // Determine Company
        // ==========================================

        const targetCompany =
            getTargetCompany(
                req,
                company || internship.company
            );

        if (!targetCompany) {
            return res.status(400).json({
                success: false,
                message: "Company is required",
            });
        }

        // ==========================================
        // Prevent Company Change
        // ==========================================

        if (
            targetCompany.toString() !==
            internship.company.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Internship company cannot be changed",
            });
        }

        // ==========================================
        // Validate Admission
        // ==========================================

        if (admission) {
            const existingAdmission =
                await Admission.findById(
                    admission
                );

            if (!existingAdmission) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Admission not found",
                });
            }

            if (
                !existingAdmission.company ||
                existingAdmission.company.toString() !==
                    targetCompany.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Admission does not belong to the selected company",
                });
            }

            internship.admission =
                admission;
        }

        // ==========================================
        // Validate Mentor
        // ==========================================

        if (mentor !== undefined) {
            if (mentor === null || mentor === "") {
                internship.mentor = undefined;
            } else {
                const existingMentor =
                    await User.findOne({
                        _id: mentor,
                        company: targetCompany,
                        role: "employee",
                        isActive: true,
                    });

                if (!existingMentor) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid or inactive employee selected as mentor",
                    });
                }

                internship.mentor =
                    mentor;
            }
        }

        // ==========================================
        // Update Fields
        // ==========================================

        if (projectTitle !== undefined) {
            internship.projectTitle =
                projectTitle;
        }

        if (technology !== undefined) {
            internship.technology =
                technology;
        }

        if (duration !== undefined) {
            internship.duration =
                duration;
        }

        if (startDate !== undefined) {
            internship.startDate =
                startDate;
        }

        if (endDate !== undefined) {
            internship.endDate =
                endDate;
        }

        if (status !== undefined) {
            const allowedStatuses = [
                "assigned",
                "in_progress",
                "completed",
                "cancelled",
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid internship status",
                });
            }

            internship.status = status;
        }

        if (
            certificateGenerated !==
            undefined
        ) {
            internship.certificateGenerated =
                certificateGenerated;
        }

        if (remarks !== undefined) {
            internship.remarks =
                remarks;
        }

        await internship.save();

        const updatedInternship =
            await populateInternship(
                Internship.findById(id)
            );

        return res.status(200).json({
            success: true,
            message:
                "Internship updated successfully",
            internship:
                updatedInternship,
        });
    } catch (error) {
        console.error(
            "Update Internship Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update internship",
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

        const allowedStatuses = [
            "assigned",
            "in_progress",
            "completed",
            "cancelled",
        ];

        if (
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid internship status",
            });
        }

        const internship =
            await Internship.findById(id);

        if (!internship) {
            return res.status(404).json({
                success: false,
                message:
                    "Internship not found",
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

        internship.status = status;

        await internship.save();

        const updatedInternship =
            await populateInternship(
                Internship.findById(
                    internship._id
                )
            );

        return res.status(200).json({
            success: true,
            message:
                "Internship status updated successfully",
            internship:
                updatedInternship,
        });
    } catch (error) {
        console.error(
            "Update Internship Status Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update internship status",
            error: error.message,
        });
    }
};

// ==========================================
// Delete Internship
// ==========================================

exports.deleteInternship = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const internship =
            await Internship.findById(id);

        if (!internship) {
            return res.status(404).json({
                success: false,
                message:
                    "Internship not found",
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

        await Internship.findByIdAndDelete(
            id
        );

        return res.status(200).json({
            success: true,
            message:
                "Internship deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Internship Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete internship",
            error: error.message,
        });
    }
};