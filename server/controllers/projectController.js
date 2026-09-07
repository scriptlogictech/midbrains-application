const Project = require("../models/Project");
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
// Create Project
// ==========================================

exports.createProject = async (req, res) => {
    try {
        const {
            company,
            clientName,
            clientCompany,
            contactNumber,
            email,
            projectTitle,
            projectDescription,
            technology,
            assignedDeveloper,
            startDate,
            deadline,
            budget,
            paidAmount,
            paymentStatus,
            projectStatus,
            deliveryDate,
            remarks,
        } = req.body || {};

        // ==========================================
        // Required Fields
        // ==========================================

        if (
            !company ||
            !clientName ||
            !contactNumber ||
            !projectTitle ||
            !startDate ||
            !deadline
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, client name, contact number, project title, start date and deadline are required",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (!hasCompanyAccess(req, company)) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot create a project for another company",
            });
        }

        // ==========================================
        // Validate Assigned Developer
        // ==========================================

        if (assignedDeveloper) {
            const developer = await User.findOne({
                _id: assignedDeveloper,
                company,
                role: "project_manager",
                isActive: true,
            });

            if (!developer) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive project manager for this company",
                });
            }
        }

        // ==========================================
        // Create Project
        // ==========================================

        const project = await Project.create({
            company,
            clientName,
            clientCompany,
            contactNumber,
            email,
            projectTitle,
            projectDescription,
            technology,
            assignedDeveloper,
            startDate,
            deadline,
            budget,
            paidAmount:
                paidAmount !== undefined
                    ? paidAmount
                    : 0,
            paymentStatus:
                paymentStatus || "pending",
            projectStatus:
                projectStatus || "pending",
            deliveryDate,
            remarks,
            createdBy: req.user._id,
        });

        const populatedProject =
            await Project.findById(project._id)
                .populate(
                    "assignedDeveloper",
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
                "Project created successfully",
            project: populatedProject,
        });
    } catch (error) {
        console.error(
            "Create Project Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create project",
            error: error.message,
        });
    }
};


// ==========================================
// Get All Projects
// ==========================================

exports.getProjects = async (req, res) => {
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

        const projects =
            await Project.find(filter)
                .populate(
                    "assignedDeveloper",
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
            projects,
        });
    } catch (error) {
        console.error(
            "Get Projects Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch projects",
            error: error.message,
        });
    }
};


// ==========================================
// Get Company Projects
// ==========================================

exports.getCompanyProjects = async (
    req,
    res
) => {
    try {
        const { companyId } = req.params;

        // ==========================================
        // Company Access
        // ==========================================

        if (!hasCompanyAccess(req, companyId)) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this company",
            });
        }

        const projects =
            await Project.find({
                company: companyId,
            })
                .populate(
                    "assignedDeveloper",
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
            projects,
        });
    } catch (error) {
        console.error(
            "Get Company Projects Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch company projects",
            error: error.message,
        });
    }
};


// ==========================================
// Update Project Status
// ==========================================

exports.updateProjectStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { projectStatus } = req.body || {};

        if (!projectStatus) {
            return res.status(400).json({
                success: false,
                message:
                    "Project status is required",
            });
        }

        const project =
            await Project.findById(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (
            !hasCompanyAccess(
                req,
                project.company
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this project",
            });
        }

        // ==========================================
        // Validate Status
        // ==========================================

        const allowedStatuses = [
            "pending",
            "in_progress",
            "testing",
            "completed",
            "delivered",
            "cancelled",
        ];

        if (
            !allowedStatuses.includes(
                projectStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid project status",
            });
        }

        project.projectStatus =
            projectStatus;

        // ==========================================
        // Delivery Date
        // ==========================================

        if (
            projectStatus === "delivered" &&
            !project.deliveryDate
        ) {
            project.deliveryDate = new Date();
        }

        await project.save();

        const updatedProject =
            await Project.findById(
                project._id
            )
                .populate(
                    "assignedDeveloper",
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

        res.status(200).json({
            success: true,
            message:
                "Project status updated successfully",
            project: updatedProject,
        });
    } catch (error) {
        console.error(
            "Update Project Status Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update project status",
            error: error.message,
        });
    }
};