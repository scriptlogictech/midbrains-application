const Placement = require("../models/Placement");
const Admission = require("../models/Admission");

// ==========================================
// CREATE PLACEMENT
// ==========================================
exports.createPlacement = async (req, res) => {
  try {
    const {
      company,
      admission,
      hiringCompany,
      jobRole,
      package: packageAmount,
      interviewDate,
      hrName,
      hrContact,
      interviewStatus,
      joiningDate,
      joiningStatus,
      offerLetter,
      remarks,
    } = req.body;

    // Required fields
    if (!company || !admission) {
      return res.status(400).json({
        success: false,
        message: "Company and admission are required",
      });
    }

    // Company access
    if (
      req.user.role !== "super_admin" &&
      String(req.user.company) !== String(company)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access another company's data",
      });
    }

    // Check admission
    const admissionData = await Admission.findById(admission);

    if (!admissionData) {
      return res.status(404).json({
        success: false,
        message: "Admission not found",
      });
    }

    // Admission must belong to same company
    if (String(admissionData.company) !== String(company)) {
      return res.status(403).json({
        success: false,
        message: "Admission does not belong to this company",
      });
    }

    const placement = await Placement.create({
      company,
      admission,
      hiringCompany,
      jobRole,
      package: packageAmount,
      interviewDate,
      hrName,
      hrContact,
      interviewStatus,
      joiningDate,
      joiningStatus,
      offerLetter,
      remarks,
      createdBy: req.user._id,
    });

    const populatedPlacement = await Placement.findById(placement._id)
      .populate(
        "admission",
        "studentName contactNumber email courseName batchName"
      )
      .populate("company", "companyName companyCode");

    res.status(201).json({
      success: true,
      message: "Placement created successfully",
      data: populatedPlacement,
    });
  } catch (error) {
    console.error("Create Placement Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create placement",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL PLACEMENTS
// ==========================================
exports.getPlacements = async (req, res) => {
  try {
    let filter = {};

    // Non-super-admin users only see their company
    if (req.user.role !== "super_admin") {
      filter.company = req.user.company;
    }

    const placements = await Placement.find(filter)
      .populate(
        "admission",
        "studentName contactNumber email courseName batchName"
      )
      .populate("company", "companyName companyCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: placements.length,
      data: placements,
    });
  } catch (error) {
    console.error("Get Placements Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch placements",
      error: error.message,
    });
  }
};

// ==========================================
// GET COMPANY PLACEMENTS
// ==========================================
exports.getCompanyPlacements = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Company isolation
    if (
      req.user.role !== "super_admin" &&
      String(req.user.company) !== String(companyId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access another company's placements",
      });
    }

    const placements = await Placement.find({
      company: companyId,
    })
      .populate(
        "admission",
        "studentName contactNumber email courseName batchName"
      )
      .populate("company", "companyName companyCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: placements.length,
      data: placements,
    });
  } catch (error) {
    console.error("Get Company Placements Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch company placements",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE PLACEMENT STATUS
// ==========================================
exports.updatePlacementStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { interviewStatus, joiningStatus } = req.body;

    const placement = await Placement.findById(id);

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: "Placement not found",
      });
    }

    // Company isolation
    if (
      req.user.role !== "super_admin" &&
      String(req.user.company) !== String(placement.company)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another company's placement",
      });
    }

    const validInterviewStatuses = [
      "scheduled",
      "selected",
      "rejected",
      "pending",
    ];

    const validJoiningStatuses = ["not_joined", "joined"];

    // Update interview status
    if (interviewStatus !== undefined) {
      if (!validInterviewStatuses.includes(interviewStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid interview status",
        });
      }

      placement.interviewStatus = interviewStatus;
    }

    // Update joining status
    if (joiningStatus !== undefined) {
      if (!validJoiningStatuses.includes(joiningStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid joining status",
        });
      }

      placement.joiningStatus = joiningStatus;
    }

    await placement.save();

    const updatedPlacement = await Placement.findById(placement._id)
      .populate(
        "admission",
        "studentName contactNumber email courseName batchName"
      )
      .populate("company", "companyName companyCode");

    res.status(200).json({
      success: true,
      message: "Placement status updated successfully",
      data: updatedPlacement,
    });
  } catch (error) {
    console.error("Update Placement Status Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update placement status",
      error: error.message,
    });
  }
};