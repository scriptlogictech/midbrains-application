const Project = require("../models/Project");
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

    // Employee can access only own company
    return (
        req.user.company &&
        req.user.company.toString() ===
            companyId.toString()
    );
};

// ==========================================
// Helper: Populate Project
// ==========================================

const populateProject = async (projectId) => {
    return await Project.findById(projectId)
        .populate(
            "assignedDeveloper",
            "fullName email role isActive"
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
                role: "employee",
                isActive: true,
            });

            if (!developer) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive employee selected for this project",
                });
            }
        }

        // ==========================================
        // Validate Dates
        // ==========================================

        if (
            new Date(deadline) <
            new Date(startDate)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Deadline cannot be before start date",
            });
        }

        // ==========================================
        // Validate Payment Status
        // ==========================================

        const allowedPaymentStatuses = [
            "pending",
            "partial",
            "paid",
        ];

        if (
            paymentStatus &&
            !allowedPaymentStatuses.includes(
                paymentStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment status",
            });
        }

        // ==========================================
        // Validate Project Status
        // ==========================================

        const allowedProjectStatuses = [
            "pending",
            "in_progress",
            "testing",
            "completed",
            "delivered",
            "cancelled",
        ];

        if (
            projectStatus &&
            !allowedProjectStatuses.includes(
                projectStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid project status",
            });
        }

        // ==========================================
        // Create Project
        // ==========================================

        const project =
            await Project.create({
                company,
                clientName: clientName.trim(),
                clientCompany:
                    clientCompany
                        ? clientCompany.trim()
                        : undefined,
                contactNumber:
                    contactNumber.trim(),
                email: email
                    ? email.toLowerCase().trim()
                    : undefined,
                projectTitle:
                    projectTitle.trim(),
                projectDescription:
                    projectDescription
                        ? projectDescription.trim()
                        : undefined,
                technology:
                    technology
                        ? technology.trim()
                        : undefined,
                assignedDeveloper:
                    assignedDeveloper ||
                    undefined,
                startDate,
                deadline,
                budget:
                    budget !== undefined &&
                    budget !== null
                        ? Number(budget)
                        : 0,
                paidAmount:
                    paidAmount !== undefined &&
                    paidAmount !== null
                        ? Number(paidAmount)
                        : 0,
                paymentStatus:
                    paymentStatus || "pending",
                projectStatus:
                    projectStatus || "pending",
                deliveryDate:
                    deliveryDate || undefined,
                remarks: remarks
                    ? remarks.trim()
                    : undefined,
                createdBy: req.user._id,
            });

        const populatedProject =
            await populateProject(project._id);

        return res.status(201).json({
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

        return res.status(500).json({
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
        // Employee → Own Company Only
        // Super Admin → All Companies
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
                    "fullName email role isActive"
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
            projects,
        });
    } catch (error) {
        console.error(
            "Get Projects Error:",
            error
        );

        return res.status(500).json({
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
                    "fullName email role isActive"
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
            projects,
        });
    } catch (error) {
        console.error(
            "Get Company Projects Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch company projects",
            error: error.message,
        });
    }
};

// ==========================================
// Get Project By ID
// ==========================================

exports.getProjectById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

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

        const populatedProject =
            await populateProject(project._id);

        return res.status(200).json({
            success: true,
            project: populatedProject,
        });
    } catch (error) {
        console.error(
            "Get Project By ID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch project",
            error: error.message,
        });
    }
};

// ==========================================
// Update Project
// ==========================================

exports.updateProject = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

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
        // Prevent Company Change
        // ==========================================

        if (
            company &&
            company.toString() !==
                project.company.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot move the project to another company",
            });
        }

        // ==========================================
        // Validate Assigned Developer
        // ==========================================

        if (assignedDeveloper) {
            const developer =
                await User.findOne({
                    _id: assignedDeveloper,
                    company: project.company,
                    role: "employee",
                    isActive: true,
                });

            if (!developer) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive employee selected for this project",
                });
            }

            project.assignedDeveloper =
                assignedDeveloper;
        } else if (
            assignedDeveloper === null
        ) {
            project.assignedDeveloper =
                undefined;
        }

        // ==========================================
        // Update Fields
        // ==========================================

        if (clientName !== undefined) {
            project.clientName =
                clientName.trim();
        }

        if (
            clientCompany !== undefined
        ) {
            project.clientCompany =
                clientCompany
                    ? clientCompany.trim()
                    : undefined;
        }

        if (
            contactNumber !== undefined
        ) {
            project.contactNumber =
                contactNumber.trim();
        }

        if (email !== undefined) {
            project.email = email
                ? email.toLowerCase().trim()
                : undefined;
        }

        if (projectTitle !== undefined) {
            project.projectTitle =
                projectTitle.trim();
        }

        if (
            projectDescription !==
            undefined
        ) {
            project.projectDescription =
                projectDescription
                    ? projectDescription.trim()
                    : undefined;
        }

        if (technology !== undefined) {
            project.technology =
                technology
                    ? technology.trim()
                    : undefined;
        }

        if (startDate !== undefined) {
            project.startDate = startDate;
        }

        if (deadline !== undefined) {
            project.deadline = deadline;
        }

        // ==========================================
        // Validate Dates
        // ==========================================

        if (
            new Date(project.deadline) <
            new Date(project.startDate)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Deadline cannot be before start date",
            });
        }

        if (budget !== undefined) {
            project.budget =
                Number(budget);
        }

        if (paidAmount !== undefined) {
            project.paidAmount =
                Number(paidAmount);
        }

        // ==========================================
        // Payment Status
        // ==========================================

        const allowedPaymentStatuses = [
            "pending",
            "partial",
            "paid",
        ];

        if (
            paymentStatus &&
            !allowedPaymentStatuses.includes(
                paymentStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment status",
            });
        }

        if (paymentStatus !== undefined) {
            project.paymentStatus =
                paymentStatus;
        }

        // ==========================================
        // Project Status
        // ==========================================

        const allowedProjectStatuses = [
            "pending",
            "in_progress",
            "testing",
            "completed",
            "delivered",
            "cancelled",
        ];

        if (
            projectStatus &&
            !allowedProjectStatuses.includes(
                projectStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid project status",
            });
        }

        if (projectStatus !== undefined) {
            project.projectStatus =
                projectStatus;
        }

        if (deliveryDate !== undefined) {
            project.deliveryDate =
                deliveryDate || undefined;
        }

        if (remarks !== undefined) {
            project.remarks = remarks
                ? remarks.trim()
                : undefined;
        }

        // Automatically set delivery date
        // when status becomes delivered.
        if (
            project.projectStatus ===
                "delivered" &&
            !project.deliveryDate
        ) {
            project.deliveryDate =
                new Date();
        }

        await project.save();

        const updatedProject =
            await populateProject(project._id);

        return res.status(200).json({
            success: true,
            message:
                "Project updated successfully",
            project: updatedProject,
        });
    } catch (error) {
        console.error(
            "Update Project Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update project",
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
        const { projectStatus } =
            req.body || {};

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
            projectStatus ===
                "delivered" &&
            !project.deliveryDate
        ) {
            project.deliveryDate =
                new Date();
        }

        await project.save();

        const updatedProject =
            await populateProject(project._id);

        return res.status(200).json({
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

        return res.status(500).json({
            success: false,
            message:
                "Failed to update project status",
            error: error.message,
        });
    }
};

// ==========================================
// Delete Project
// ==========================================

exports.deleteProject = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

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

        await Project.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message:
                "Project deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Project Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete project",
            error: error.message,
        });
    }
};