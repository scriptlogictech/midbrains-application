const Lead = require("../models/Lead");
const Admission = require("../models/Admission");
const Internship = require("../models/Internship");
const CorporateTraining = require("../models/CorporateTraining");
const Project = require("../models/Project");
const Placement = require("../models/Placement");
const Company = require("../models/Company");

// ============================================================
// HELPER - COMPANY FILTER
// ============================================================

const getCompanyFilter = (req) => {
    if (req.user.role === "super_admin") {
        return {};
    }

    return {
        company: req.user.company,
    };
};

// ============================================================
// DASHBOARD SUMMARY
// ============================================================

const dashboardSummary = async (req, res) => {
    try {
        const companyFilter =
            getCompanyFilter(req);

        const [
            totalCompanies,
            totalLeads,
            totalAdmissions,
            totalInternships,
            totalCorporateTrainings,
            totalProjects,
            totalPlacements,
        ] = await Promise.all([
            req.user.role === "super_admin"
                ? Company.countDocuments()
                : Company.countDocuments({
                      _id: req.user.company,
                  }),

            Lead.countDocuments(
                companyFilter
            ),

            Admission.countDocuments(
                companyFilter
            ),

            Internship.countDocuments(
                companyFilter
            ),

            CorporateTraining.countDocuments(
                companyFilter
            ),

            Project.countDocuments(
                companyFilter
            ),

            Placement.countDocuments(
                companyFilter
            ),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalCompanies,
                totalLeads,
                totalAdmissions,
                totalInternships,
                totalCorporateTrainings,
                totalProjects,
                totalPlacements,
            },
        });
    } catch (error) {
        console.error(
            "Dashboard Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch dashboard report",
            error: error.message,
        });
    }
};

// ============================================================
// LEAD REPORT
// ============================================================

const getLeadReport = async (req, res) => {
    try {
        const companyFilter =
            getCompanyFilter(req);

        const [
            total,
            newLeads,
            contacted,
            interested,
            followUp,
            converted,
            notInterested,
            closed,
        ] = await Promise.all([
            Lead.countDocuments(
                companyFilter
            ),

            Lead.countDocuments({
                ...companyFilter,
                status: "new",
            }),

            Lead.countDocuments({
                ...companyFilter,
                status: "contacted",
            }),

            Lead.countDocuments({
                ...companyFilter,
                status: "interested",
            }),

            Lead.countDocuments({
                ...companyFilter,
                status: "follow_up",
            }),

            Lead.countDocuments({
                ...companyFilter,
                status: "converted",
            }),

            Lead.countDocuments({
                ...companyFilter,
                status: "not_interested",
            }),

            Lead.countDocuments({
                ...companyFilter,
                status: "closed",
            }),
        ]);

        const conversionRate =
            total > 0
                ? Number(
                      (
                          (converted / total) *
                          100
                      ).toFixed(2)
                  )
                : 0;

        return res.status(200).json({
            success: true,
            data: {
                total,
                new: newLeads,
                contacted,
                interested,
                followUp,
                converted,
                notInterested,
                closed,
                conversionRate,
            },
        });
    } catch (error) {
        console.error(
            "Lead Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch lead report",
            error: error.message,
        });
    }
};

// ============================================================
// ADMISSION REPORT
// ============================================================

const getAdmissionReport = async (
    req,
    res
) => {
    try {
        const companyFilter =
            getCompanyFilter(req);

        const total =
            await Admission.countDocuments(
                companyFilter
            );

        return res.status(200).json({
            success: true,
            data: {
                total,
            },
        });
    } catch (error) {
        console.error(
            "Admission Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch admission report",
            error: error.message,
        });
    }
};

// ============================================================
// INTERNSHIP REPORT
// ============================================================

const getInternshipReport = async (
    req,
    res
) => {
    try {
        const companyFilter =
            getCompanyFilter(req);

        const total =
            await Internship.countDocuments(
                companyFilter
            );

        return res.status(200).json({
            success: true,
            data: {
                total,
            },
        });
    } catch (error) {
        console.error(
            "Internship Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch internship report",
            error: error.message,
        });
    }
};

// ============================================================
// CORPORATE TRAINING REPORT
// ============================================================

const getCorporateTrainingReport =
    async (req, res) => {
        try {
            const companyFilter =
                getCompanyFilter(req);

            const total =
                await CorporateTraining.countDocuments(
                    companyFilter
                );

            return res.status(200).json({
                success: true,
                data: {
                    total,
                },
            });
        } catch (error) {
            console.error(
                "Corporate Training Report Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch corporate training report",
                error: error.message,
            });
        }
    };

// ============================================================
// PROJECT REPORT
// ============================================================

const getProjectReport = async (
    req,
    res
) => {
    try {
        const companyFilter =
            getCompanyFilter(req);

        const total =
            await Project.countDocuments(
                companyFilter
            );

        return res.status(200).json({
            success: true,
            data: {
                total,
            },
        });
    } catch (error) {
        console.error(
            "Project Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch project report",
            error: error.message,
        });
    }
};

// ============================================================
// PLACEMENT REPORT
// ============================================================

const getPlacementReport = async (
    req,
    res
) => {
    try {
        const companyFilter =
            getCompanyFilter(req);

        const [
            total,
            scheduled,
            selected,
            rejected,
            pending,
            joined,
        ] = await Promise.all([
            Placement.countDocuments(
                companyFilter
            ),

            Placement.countDocuments({
                ...companyFilter,
                interviewStatus:
                    "scheduled",
            }),

            Placement.countDocuments({
                ...companyFilter,
                interviewStatus:
                    "selected",
            }),

            Placement.countDocuments({
                ...companyFilter,
                interviewStatus:
                    "rejected",
            }),

            Placement.countDocuments({
                ...companyFilter,
                interviewStatus:
                    "pending",
            }),

            Placement.countDocuments({
                ...companyFilter,
                joiningStatus: "joined",
            }),
        ]);

        const placementRate =
            total > 0
                ? Number(
                      (
                          (selected / total) *
                          100
                      ).toFixed(2)
                  )
                : 0;

        return res.status(200).json({
            success: true,
            data: {
                total,
                scheduled,
                selected,
                rejected,
                pending,
                joined,
                placementRate,
            },
        });
    } catch (error) {
        console.error(
            "Placement Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch placement report",
            error: error.message,
        });
    }
};

// ============================================================
// REVENUE REPORT
// ============================================================

const revenueReport = async (
    req,
    res
) => {
    try {
        const companyFilter =
            getCompanyFilter(req);

        const [
            admissionRevenue,
            projectRevenue,
            corporateTrainingRevenue,
        ] = await Promise.all([
            Admission.aggregate([
                {
                    $match:
                        companyFilter,
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$paidAmount",
                        },
                    },
                },
            ]),

            Project.aggregate([
                {
                    $match:
                        companyFilter,
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$paidAmount",
                        },
                    },
                },
            ]),

            CorporateTraining.aggregate([
                {
                    $match:
                        companyFilter,
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$paymentAmount",
                        },
                    },
                },
            ]),
        ]);

        const admissionTotal =
            admissionRevenue[0]
                ?.total || 0;

        const projectTotal =
            projectRevenue[0]
                ?.total || 0;

        const corporateTrainingTotal =
            corporateTrainingRevenue[0]
                ?.total || 0;

        const totalRevenue =
            admissionTotal +
            projectTotal +
            corporateTrainingTotal;

        return res.status(200).json({
            success: true,
            data: {
                admissionRevenue:
                    admissionTotal,

                projectRevenue:
                    projectTotal,

                corporateTrainingRevenue:
                    corporateTrainingTotal,

                totalRevenue,
            },
        });
    } catch (error) {
        console.error(
            "Revenue Report Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch revenue report",
            error: error.message,
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    dashboardSummary,

    getLeadReport,
    getAdmissionReport,
    getInternshipReport,
    getCorporateTrainingReport,
    getProjectReport,
    getPlacementReport,

    revenueReport,
};