const CorporateTraining = require("../models/CorporateTraining");
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
        req.user.company.toString() === companyId.toString()
    );
};

// ==========================================
// Helper: Get Target Company
// ==========================================

const getTargetCompany = (req, requestedCompany) => {
    if (req.user.role === "super_admin") {
        return requestedCompany;
    }

    return req.user.company;
};

// ==========================================
// Helper: Populate Training
// ==========================================

const populateTraining = async (trainingId) => {
    return await CorporateTraining.findById(trainingId)
        .populate(
            "trainer",
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
// Create Corporate Training
// ==========================================

exports.createCorporateTraining = async (req, res) => {
    try {
        const {
            company,
            clientCompanyName,
            contactPerson,
            contactNumber,
            email,
            trainingTopic,
            technology,
            employeeCount,
            trainer,
            startDate,
            endDate,
            paymentAmount,
            paymentStatus,
            trainingStatus,
            remarks,
        } = req.body || {};

        // ==========================================
        // Validate Required Fields
        // ==========================================

        if (
            !company ||
            !clientCompanyName ||
            !contactPerson ||
            !contactNumber ||
            !trainingTopic ||
            employeeCount === undefined ||
            employeeCount === null ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, client company name, contact person, contact number, training topic, employee count, start date and end date are required",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (!hasCompanyAccess(req, company)) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot create training for another company",
            });
        }

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
        // Validate Trainer
        // ==========================================

        if (trainer) {
            const existingTrainer = await User.findOne({
                _id: trainer,
                company: targetCompany,
                role: "employee",
                isActive: true,
            });

            if (!existingTrainer) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive employee selected as trainer",
                });
            }
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
                message: "Invalid payment status",
            });
        }

        // ==========================================
        // Validate Training Status
        // ==========================================

        const allowedTrainingStatuses = [
            "scheduled",
            "ongoing",
            "completed",
            "cancelled",
        ];

        if (
            trainingStatus &&
            !allowedTrainingStatuses.includes(
                trainingStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid training status",
            });
        }

        // ==========================================
        // Validate Employee Count
        // ==========================================

        if (Number(employeeCount) < 1) {
            return res.status(400).json({
                success: false,
                message:
                    "Employee count must be at least 1",
            });
        }

        // ==========================================
        // Validate Dates
        // ==========================================

        if (
            new Date(endDate) <
            new Date(startDate)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "End date cannot be before start date",
            });
        }

        // ==========================================
        // Create Training
        // ==========================================

        const training =
            await CorporateTraining.create({
                company: targetCompany,
                clientCompanyName:
                    clientCompanyName.trim(),
                contactPerson:
                    contactPerson.trim(),
                contactNumber:
                    contactNumber.trim(),
                email: email
                    ? email.toLowerCase().trim()
                    : undefined,
                trainingTopic:
                    trainingTopic.trim(),
                technology: technology
                    ? technology.trim()
                    : undefined,
                employeeCount: Number(employeeCount),
                trainer: trainer || undefined,
                startDate,
                endDate,
                paymentAmount:
                    paymentAmount !== undefined &&
                    paymentAmount !== null
                        ? Number(paymentAmount)
                        : 0,
                paymentStatus:
                    paymentStatus || "pending",
                trainingStatus:
                    trainingStatus || "scheduled",
                remarks: remarks
                    ? remarks.trim()
                    : undefined,
                createdBy: req.user._id,
            });

        const populatedTraining =
            await populateTraining(training._id);

        return res.status(201).json({
            success: true,
            message:
                "Corporate training created successfully",
            training: populatedTraining,
        });
    } catch (error) {
        console.error(
            "Create Corporate Training Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create corporate training",
            error: error.message,
        });
    }
};

// ==========================================
// Get All Corporate Trainings
// ==========================================

exports.getCorporateTrainings = async (
    req,
    res
) => {
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

        const trainings =
            await CorporateTraining.find(filter)
                .populate(
                    "trainer",
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
            trainings,
        });
    } catch (error) {
        console.error(
            "Get Corporate Trainings Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch corporate trainings",
            error: error.message,
        });
    }
};

// ==========================================
// Get Company Corporate Trainings
// ==========================================

exports.getCompanyCorporateTrainings = async (
    req,
    res
) => {
    try {
        const { companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "Company ID is required",
            });
        }

        if (!hasCompanyAccess(req, companyId)) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this company",
            });
        }

        const trainings =
            await CorporateTraining.find({
                company: companyId,
            })
                .populate(
                    "trainer",
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
            trainings,
        });
    } catch (error) {
        console.error(
            "Get Company Corporate Trainings Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch company corporate trainings",
            error: error.message,
        });
    }
};

// ==========================================
// Get Single Corporate Training
// ==========================================

exports.getCorporateTrainingById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const training =
            await CorporateTraining.findById(id);

        if (!training) {
            return res.status(404).json({
                success: false,
                message:
                    "Corporate training not found",
            });
        }

        if (
            !hasCompanyAccess(
                req,
                training.company
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this training",
            });
        }

        const populatedTraining =
            await populateTraining(training._id);

        return res.status(200).json({
            success: true,
            training: populatedTraining,
        });
    } catch (error) {
        console.error(
            "Get Corporate Training Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch corporate training",
            error: error.message,
        });
    }
};

// ==========================================
// Update Corporate Training
// ==========================================

exports.updateCorporateTraining = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const training =
            await CorporateTraining.findById(id);

        if (!training) {
            return res.status(404).json({
                success: false,
                message:
                    "Corporate training not found",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (
            !hasCompanyAccess(
                req,
                training.company
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this training",
            });
        }

        const {
            company,
            clientCompanyName,
            contactPerson,
            contactNumber,
            email,
            trainingTopic,
            technology,
            employeeCount,
            trainer,
            startDate,
            endDate,
            paymentAmount,
            paymentStatus,
            trainingStatus,
            remarks,
        } = req.body || {};

        // ==========================================
        // Prevent Company Change
        // ==========================================

        if (
            company &&
            company.toString() !==
                training.company.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot move training to another company",
            });
        }

        // ==========================================
        // Validate Trainer
        // ==========================================

        if (trainer) {
            const existingTrainer =
                await User.findOne({
                    _id: trainer,
                    company: training.company,
                    role: "employee",
                    isActive: true,
                });

            if (!existingTrainer) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive employee selected as trainer",
                });
            }

            training.trainer = trainer;
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
                message: "Invalid payment status",
            });
        }

        // ==========================================
        // Validate Training Status
        // ==========================================

        const allowedTrainingStatuses = [
            "scheduled",
            "ongoing",
            "completed",
            "cancelled",
        ];

        if (
            trainingStatus &&
            !allowedTrainingStatuses.includes(
                trainingStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid training status",
            });
        }

        // ==========================================
        // Update Fields
        // ==========================================

        if (clientCompanyName !== undefined) {
            training.clientCompanyName =
                clientCompanyName.trim();
        }

        if (contactPerson !== undefined) {
            training.contactPerson =
                contactPerson.trim();
        }

        if (contactNumber !== undefined) {
            training.contactNumber =
                contactNumber.trim();
        }

        if (email !== undefined) {
            training.email = email
                ? email.toLowerCase().trim()
                : undefined;
        }

        if (trainingTopic !== undefined) {
            training.trainingTopic =
                trainingTopic.trim();
        }

        if (technology !== undefined) {
            training.technology = technology
                ? technology.trim()
                : undefined;
        }

        if (employeeCount !== undefined) {
            if (Number(employeeCount) < 1) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Employee count must be at least 1",
                });
            }

            training.employeeCount =
                Number(employeeCount);
        }

        if (startDate !== undefined) {
            training.startDate = startDate;
        }

        if (endDate !== undefined) {
            training.endDate = endDate;
        }

        if (
            new Date(training.endDate) <
            new Date(training.startDate)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "End date cannot be before start date",
            });
        }

        if (paymentAmount !== undefined) {
            training.paymentAmount =
                Number(paymentAmount);
        }

        if (paymentStatus !== undefined) {
            training.paymentStatus =
                paymentStatus;
        }

        if (trainingStatus !== undefined) {
            training.trainingStatus =
                trainingStatus;
        }

        if (remarks !== undefined) {
            training.remarks = remarks
                ? remarks.trim()
                : undefined;
        }

        await training.save();

        const updatedTraining =
            await populateTraining(training._id);

        return res.status(200).json({
            success: true,
            message:
                "Corporate training updated successfully",
            training: updatedTraining,
        });
    } catch (error) {
        console.error(
            "Update Corporate Training Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update corporate training",
            error: error.message,
        });
    }
};

// ==========================================
// Update Training Status
// ==========================================

exports.updateTrainingStatus = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { trainingStatus } = req.body || {};

        if (!trainingStatus) {
            return res.status(400).json({
                success: false,
                message:
                    "Training status is required",
            });
        }

        const training =
            await CorporateTraining.findById(id);

        if (!training) {
            return res.status(404).json({
                success: false,
                message:
                    "Corporate training not found",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (
            !hasCompanyAccess(
                req,
                training.company
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this training",
            });
        }

        // ==========================================
        // Validate Status
        // ==========================================

        const allowedStatuses = [
            "scheduled",
            "ongoing",
            "completed",
            "cancelled",
        ];

        if (
            !allowedStatuses.includes(
                trainingStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid training status",
            });
        }

        training.trainingStatus =
            trainingStatus;

        await training.save();

        const updatedTraining =
            await populateTraining(training._id);

        return res.status(200).json({
            success: true,
            message:
                "Training status updated successfully",
            training: updatedTraining,
        });
    } catch (error) {
        console.error(
            "Update Training Status Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update training status",
            error: error.message,
        });
    }
};

// ==========================================
// Delete Corporate Training
// ==========================================

exports.deleteCorporateTraining = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const training =
            await CorporateTraining.findById(id);

        if (!training) {
            return res.status(404).json({
                success: false,
                message:
                    "Corporate training not found",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (
            !hasCompanyAccess(
                req,
                training.company
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this training",
            });
        }

        await CorporateTraining.findByIdAndDelete(
            id
        );

        return res.status(200).json({
            success: true,
            message:
                "Corporate training deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Corporate Training Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete corporate training",
            error: error.message,
        });
    }
};