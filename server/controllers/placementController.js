const Placement = require("../models/Placement");
const Admission = require("../models/Admission");

// ==========================================
// HELPERS
// ==========================================

const hasCompanyAccess = (req, companyId) => {
  if (req.user.role === "super_admin") {
    return true;
  }

  return (
    req.user.company &&
    String(req.user.company) === String(companyId)
  );
};

const populatePlacement = (query) => {
  return query
    .populate(
      "admission",
      "studentName contactNumber email courseName batchName"
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

const validInterviewStatuses = [
  "scheduled",
  "selected",
  "rejected",
  "pending",
];

const validJoiningStatuses = [
  "not_joined",
  "joined",
];

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

    // ----------------------------------------
    // Required fields
    // ----------------------------------------

    if (!company || !admission) {
      return res.status(400).json({
        success: false,
        message:
          "Company and admission are required",
      });
    }

    // ----------------------------------------
    // Company access
    // ----------------------------------------

    if (!hasCompanyAccess(req, company)) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access another company's data",
      });
    }

    // ----------------------------------------
    // Check admission
    // ----------------------------------------

    const admissionData =
      await Admission.findById(admission);

    if (!admissionData) {
      return res.status(404).json({
        success: false,
        message: "Admission not found",
      });
    }

    // ----------------------------------------
    // Admission company validation
    // ----------------------------------------

    if (
      String(admissionData.company) !==
      String(company)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admission does not belong to this company",
      });
    }

    // ----------------------------------------
    // Validate interview status
    // ----------------------------------------

    if (
      interviewStatus !== undefined &&
      !validInterviewStatuses.includes(
        interviewStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview status",
      });
    }

    // ----------------------------------------
    // Validate joining status
    // ----------------------------------------

    if (
      joiningStatus !== undefined &&
      !validJoiningStatuses.includes(
        joiningStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid joining status",
      });
    }

    // ----------------------------------------
    // Validate package
    // ----------------------------------------

    if (
      packageAmount !== undefined &&
      packageAmount !== null &&
      Number(packageAmount) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Package amount cannot be negative",
      });
    }

    // ----------------------------------------
    // Validate joining date
    // ----------------------------------------

    if (
      interviewDate &&
      joiningDate &&
      new Date(joiningDate) <
        new Date(interviewDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Joining date cannot be before interview date",
      });
    }

    // ----------------------------------------
    // Prevent duplicate placement
    // ----------------------------------------

    const existingPlacement =
      await Placement.findOne({
        admission,
        company,
      });

    if (existingPlacement) {
      return res.status(409).json({
        success: false,
        message:
          "A placement record already exists for this admission",
      });
    }

    // ----------------------------------------
    // Create placement
    // ----------------------------------------

    const placement =
      await Placement.create({
        company,
        admission,
        hiringCompany,
        jobRole,
        package: packageAmount,
        interviewDate,
        hrName,
        hrContact,
        interviewStatus:
          interviewStatus || "pending",
        joiningDate,
        joiningStatus:
          joiningStatus || "not_joined",
        offerLetter,
        remarks,
        createdBy: req.user._id,
      });

    const populatedPlacement =
      await populatePlacement(
        Placement.findById(placement._id)
      );

    return res.status(201).json({
      success: true,
      message:
        "Placement created successfully",
      data: populatedPlacement,
    });
  } catch (error) {
    console.error(
      "Create Placement Error:",
      error
    );

    return res.status(500).json({
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

    // Non-super-admin users only see
    // their own company's placements.
    if (req.user.role !== "super_admin") {
      filter.company = req.user.company;
    }

    const placements =
      await populatePlacement(
        Placement.find(filter).sort({
          createdAt: -1,
        })
      );

    return res.status(200).json({
      success: true,
      count: placements.length,
      data: placements,
    });
  } catch (error) {
    console.error(
      "Get Placements Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch placements",
      error: error.message,
    });
  }
};

// ==========================================
// GET COMPANY PLACEMENTS
// ==========================================

exports.getCompanyPlacements = async (
  req,
  res
) => {
  try {
    const { companyId } = req.params;

    // ----------------------------------------
    // Company isolation
    // ----------------------------------------

    if (
      !hasCompanyAccess(
        req,
        companyId
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access another company's placements",
      });
    }

    const placements =
      await populatePlacement(
        Placement.find({
          company: companyId,
        }).sort({
          createdAt: -1,
        })
      );

    return res.status(200).json({
      success: true,
      count: placements.length,
      data: placements,
    });
  } catch (error) {
    console.error(
      "Get Company Placements Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch company placements",
      error: error.message,
    });
  }
};

// ==========================================
// GET PLACEMENT BY ID
// ==========================================

exports.getPlacementById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const placement =
      await populatePlacement(
        Placement.findById(id)
      );

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: "Placement not found",
      });
    }

    // ----------------------------------------
    // Company isolation
    // ----------------------------------------

    if (
      !hasCompanyAccess(
        req,
        placement.company?._id ||
          placement.company
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot access another company's placement",
      });
    }

    return res.status(200).json({
      success: true,
      data: placement,
    });
  } catch (error) {
    console.error(
      "Get Placement By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch placement",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE PLACEMENT
// ==========================================

exports.updatePlacement = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const placement =
      await Placement.findById(id);

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: "Placement not found",
      });
    }

    // ----------------------------------------
    // Company isolation
    // ----------------------------------------

    if (
      !hasCompanyAccess(
        req,
        placement.company
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot update another company's placement",
      });
    }

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

    // ----------------------------------------
    // Company cannot be changed
    // ----------------------------------------

    if (
      company !== undefined &&
      String(company) !==
        String(placement.company)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Placement company cannot be changed",
      });
    }

    // ----------------------------------------
    // Admission validation
    // ----------------------------------------

    if (admission !== undefined) {
      const admissionData =
        await Admission.findById(
          admission
        );

      if (!admissionData) {
        return res.status(404).json({
          success: false,
          message: "Admission not found",
        });
      }

      if (
        String(admissionData.company) !==
        String(placement.company)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admission does not belong to this company",
        });
      }

      placement.admission = admission;
    }

    // ----------------------------------------
    // Validate package
    // ----------------------------------------

    if (
      packageAmount !== undefined &&
      packageAmount !== null &&
      Number(packageAmount) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Package amount cannot be negative",
      });
    }

    // ----------------------------------------
    // Validate interview status
    // ----------------------------------------

    if (
      interviewStatus !== undefined
    ) {
      if (
        !validInterviewStatuses.includes(
          interviewStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid interview status",
        });
      }

      placement.interviewStatus =
        interviewStatus;
    }

    // ----------------------------------------
    // Validate joining status
    // ----------------------------------------

    if (
      joiningStatus !== undefined
    ) {
      if (
        !validJoiningStatuses.includes(
          joiningStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid joining status",
        });
      }

      placement.joiningStatus =
        joiningStatus;
    }

    // ----------------------------------------
    // Date validation
    // ----------------------------------------

    const finalInterviewDate =
      interviewDate !== undefined
        ? interviewDate
        : placement.interviewDate;

    const finalJoiningDate =
      joiningDate !== undefined
        ? joiningDate
        : placement.joiningDate;

    if (
      finalInterviewDate &&
      finalJoiningDate &&
      new Date(finalJoiningDate) <
        new Date(finalInterviewDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Joining date cannot be before interview date",
      });
    }

    // ----------------------------------------
    // Update fields
    // ----------------------------------------

    if (
      hiringCompany !== undefined
    ) {
      placement.hiringCompany =
        hiringCompany;
    }

    if (jobRole !== undefined) {
      placement.jobRole = jobRole;
    }

    if (
      packageAmount !== undefined
    ) {
      placement.package =
        packageAmount;
    }

    if (
      interviewDate !== undefined
    ) {
      placement.interviewDate =
        interviewDate;
    }

    if (hrName !== undefined) {
      placement.hrName = hrName;
    }

    if (hrContact !== undefined) {
      placement.hrContact = hrContact;
    }

    if (
      joiningDate !== undefined
    ) {
      placement.joiningDate =
        joiningDate;
    }

    if (
      offerLetter !== undefined
    ) {
      placement.offerLetter =
        offerLetter;
    }

    if (remarks !== undefined) {
      placement.remarks = remarks;
    }

    await placement.save();

    const updatedPlacement =
      await populatePlacement(
        Placement.findById(
          placement._id
        )
      );

    return res.status(200).json({
      success: true,
      message:
        "Placement updated successfully",
      data: updatedPlacement,
    });
  } catch (error) {
    console.error(
      "Update Placement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update placement",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE PLACEMENT STATUS
// ==========================================

exports.updatePlacementStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const {
      interviewStatus,
      joiningStatus,
    } = req.body;

    const placement =
      await Placement.findById(id);

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: "Placement not found",
      });
    }

    // ----------------------------------------
    // Company isolation
    // ----------------------------------------

    if (
      !hasCompanyAccess(
        req,
        placement.company
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot update another company's placement",
      });
    }

    // ----------------------------------------
    // Interview status
    // ----------------------------------------

    if (
      interviewStatus !== undefined
    ) {
      if (
        !validInterviewStatuses.includes(
          interviewStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid interview status",
        });
      }

      placement.interviewStatus =
        interviewStatus;
    }

    // ----------------------------------------
    // Joining status
    // ----------------------------------------

    if (
      joiningStatus !== undefined
    ) {
      if (
        !validJoiningStatuses.includes(
          joiningStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid joining status",
        });
      }

      placement.joiningStatus =
        joiningStatus;
    }

    await placement.save();

    const updatedPlacement =
      await populatePlacement(
        Placement.findById(
          placement._id
        )
      );

    return res.status(200).json({
      success: true,
      message:
        "Placement status updated successfully",
      data: updatedPlacement,
    });
  } catch (error) {
    console.error(
      "Update Placement Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update placement status",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE PLACEMENT
// ==========================================

exports.deletePlacement = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const placement =
      await Placement.findById(id);

    if (!placement) {
      return res.status(404).json({
        success: false,
        message: "Placement not found",
      });
    }

    // ----------------------------------------
    // Company isolation
    // ----------------------------------------

    if (
      !hasCompanyAccess(
        req,
        placement.company
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot delete another company's placement",
      });
    }

    await Placement.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Placement deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Placement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete placement",
      error: error.message,
    });
  }
};