const CorporateTraining = require("../models/CorporateTraining");
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

        // ==========================================
        // Validate Trainer
        // ==========================================

        if (trainer) {
            const existingTrainer =
                await User.findOne({
                    _id: trainer,
                    company,
                    role: "trainer",
                    isActive: true,
                });

            if (!existingTrainer) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive trainer for this company",
                });
            }
        }

        // ==========================================
        // Create Training
        // ==========================================

        const training =
            await CorporateTraining.create({
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
                paymentAmount:
                    paymentAmount !== undefined
                        ? paymentAmount
                        : 0,
                paymentStatus:
                    paymentStatus || "pending",
                trainingStatus:
                    trainingStatus || "scheduled",
                remarks,
                createdBy: req.user._id,
            });

        const populatedTraining =
            await CorporateTraining.findById(
                training._id
            )
                .populate(
                    "trainer",
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
                "Corporate training created successfully",
            training: populatedTraining,
        });
    } catch (error) {
        console.error(
            "Create Corporate Training Error:",
            error
        );

        res.status(500).json({
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

exports.getCorporateTrainings = async (req, res) => {
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

        const trainings =
            await CorporateTraining.find(filter)
                .populate(
                    "trainer",
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
            trainings,
        });
    } catch (error) {
        console.error(
            "Get Corporate Trainings Error:",
            error
        );

        res.status(500).json({
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
            trainings,
        });
    } catch (error) {
        console.error(
            "Get Company Corporate Trainings Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch company corporate trainings",
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
            await CorporateTraining.findById(
                training._id
            )
                .populate(
                    "trainer",
                    "fullName email role"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                );

        res.status(200).json({
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

        res.status(500).json({
            success: false,
            message:
                "Failed to update training status",
            error: error.message,
        });
    }
};