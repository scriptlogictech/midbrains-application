const Lead = require("../models/Lead");
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

    // Other users can access only their assigned company
    return (
        req.user.company &&
        req.user.company.toString() === companyId.toString()
    );
};


// ==========================================
// Get Leads By Company
// ==========================================

exports.getLeads = async (req, res) => {
    try {
        const { companyId } = req.params;

        if (!hasCompanyAccess(req, companyId)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this company",
            });
        }

        const leads = await Lead.find({
            company: companyId,
        })
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate(
                "createdBy",
                "fullName email role"
            )
            .populate(
                "company",
                "companyName companyCode"
            )
            .sort({
                createdAt: -1,
            });

        res.status(200).json({
            success: true,
            leads,
        });
    } catch (error) {
        console.error("Get Leads Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch leads",
            error: error.message,
        });
    }
};


// ==========================================
// Create Lead
// ==========================================

exports.createLead = async (req, res) => {
    try {
        const {
            company,
            fullName,
            contactNumber,
            email,
            city,
            courseInterested,
            inquiryType,
            leadSource,
            assignedCounselor,
            priority,
            status,
            nextFollowUpDate,
            notes,
            expectedFees,
            admissionDate,
        } = req.body || {};

        if (
            !company ||
            !fullName ||
            !contactNumber
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Company, full name and contact number are required",
            });
        }

        // ==========================================
        // Company Access Check
        // ==========================================

        if (!hasCompanyAccess(req, company)) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot create a lead for another company",
            });
        }

        // ==========================================
        // Assigned Counselor Validation
        // ==========================================

        if (assignedCounselor) {
            const counselor = await User.findOne({
                _id: assignedCounselor,
                company,
                role: "counselor",
                isActive: true,
            });

            if (!counselor) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive counselor for this company",
                });
            }
        }

        const lead = await Lead.create({
            company,
            fullName,
            contactNumber,
            email,
            city,
            courseInterested,
            inquiryType,
            leadSource,
            assignedCounselor,
            priority,
            status,
            nextFollowUpDate,
            notes,
            expectedFees,
            admissionDate,
            createdBy: req.user._id,
        });

        const populatedLead = await Lead.findById(
            lead._id
        )
            .populate(
                "assignedCounselor",
                "fullName email role"
            )
            .populate(
                "createdBy",
                "fullName email role"
            )
            .populate(
                "company",
                "companyName companyCode"
            );

        res.status(201).json({
            success: true,
            message: "Lead created successfully",
            lead: populatedLead,
        });
    } catch (error) {
        console.error("Create Lead Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create lead",
            error: error.message,
        });
    }
};


// ==========================================
// Update Lead
// ==========================================

exports.updateLead = async (req, res) => {
    try {
        const { leadId } = req.params;

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        // ==========================================
        // Company Access
        // ==========================================

        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this lead",
            });
        }

        const {
            fullName,
            contactNumber,
            email,
            city,
            courseInterested,
            inquiryType,
            leadSource,
            assignedCounselor,
            priority,
            status,
            nextFollowUpDate,
            notes,
            expectedFees,
            admissionDate,
        } = req.body || {};

        // ==========================================
        // Counselor Validation
        // ==========================================

        if (assignedCounselor) {
            const counselor = await User.findOne({
                _id: assignedCounselor,
                company: lead.company,
                role: "counselor",
                isActive: true,
            });

            if (!counselor) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid or inactive counselor for this company",
                });
            }
        }

        // ==========================================
        // Update Only Provided Fields
        // ==========================================

        const updateData = {};

        if (fullName !== undefined)
            updateData.fullName = fullName;

        if (contactNumber !== undefined)
            updateData.contactNumber = contactNumber;

        if (email !== undefined)
            updateData.email = email;

        if (city !== undefined)
            updateData.city = city;

        if (courseInterested !== undefined)
            updateData.courseInterested =
                courseInterested;

        if (inquiryType !== undefined)
            updateData.inquiryType = inquiryType;

        if (leadSource !== undefined)
            updateData.leadSource = leadSource;

        if (assignedCounselor !== undefined)
            updateData.assignedCounselor =
                assignedCounselor;

        if (priority !== undefined)
            updateData.priority = priority;

        if (status !== undefined)
            updateData.status = status;

        if (nextFollowUpDate !== undefined)
            updateData.nextFollowUpDate =
                nextFollowUpDate;

        if (notes !== undefined)
            updateData.notes = notes;

        if (expectedFees !== undefined)
            updateData.expectedFees = expectedFees;

        if (admissionDate !== undefined)
            updateData.admissionDate =
                admissionDate;

        const updatedLead =
            await Lead.findByIdAndUpdate(
                leadId,
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            )
                .populate(
                    "assignedCounselor",
                    "fullName email role"
                )
                .populate(
                    "createdBy",
                    "fullName email role"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                );

        res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            lead: updatedLead,
        });
    } catch (error) {
        console.error("Update Lead Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update lead",
            error: error.message,
        });
    }
};


// ==========================================
// Update Lead Status
// ==========================================

exports.updateLeadStatus = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { status } = req.body || {};

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required",
            });
        }

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this lead",
            });
        }

        lead.status = status;

        await lead.save();

        const updatedLead =
            await Lead.findById(lead._id)
                .populate(
                    "assignedCounselor",
                    "fullName email role"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                );

        res.status(200).json({
            success: true,
            message: "Lead status updated successfully",
            lead: updatedLead,
        });
    } catch (error) {
        console.error(
            "Update Lead Status Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update lead status",
            error: error.message,
        });
    }
};


// ==========================================
// Add Communication
// ==========================================

exports.addCommunication = async (req, res) => {
    try {
        const { leadId } = req.params;

        const {
            type,
            message,
            date,
        } = req.body || {};

        if (!type || !message) {
            return res.status(400).json({
                success: false,
                message:
                    "Communication type and message are required",
            });
        }

        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        if (!hasCompanyAccess(req, lead.company)) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have access to this lead",
            });
        }

        lead.communicationHistory.push({
            type,
            message,
            date: date || Date.now(),
        });

        await lead.save();

        const updatedLead =
            await Lead.findById(lead._id)
                .populate(
                    "assignedCounselor",
                    "fullName email role"
                )
                .populate(
                    "company",
                    "companyName companyCode"
                );

        res.status(200).json({
            success: true,
            message:
                "Communication added successfully",
            lead: updatedLead,
        });
    } catch (error) {
        console.error(
            "Add Communication Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to add communication",
            error: error.message,
        });
    }
};


exports.getLeads = async (req, res) => {
  try {
    const { companyId } = req.params;

    // ==========================================
    // COMPANY SECURITY
    // ==========================================
    if (
      req.user.role !== "super_admin" &&
      String(req.user.company) !== String(companyId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access another company's leads",
      });
    }

    // ==========================================
    // QUERY PARAMETERS
    // ==========================================
    const {
      search = "",
      status,
      priority,
      inquiryType,
      assignedCounselor,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // ==========================================
    // BASE FILTER
    // ==========================================
    const filter = {
      company: companyId,
    };

    // ==========================================
    // SEARCH
    // ==========================================
    if (search.trim()) {
      filter.$or = [
        {
          fullName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          contactNumber: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          city: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // ==========================================
    // STATUS FILTER
    // ==========================================
    if (status) {
      filter.status = status;
    }

    // ==========================================
    // PRIORITY FILTER
    // ==========================================
    if (priority) {
      filter.priority = priority;
    }

    // ==========================================
    // INQUIRY TYPE FILTER
    // ==========================================
    if (inquiryType) {
      filter.inquiryType = inquiryType;
    }

    // ==========================================
    // COUNSELOR FILTER
    // ==========================================
    if (assignedCounselor) {
      filter.assignedCounselor = assignedCounselor;
    }

    // ==========================================
    // DATE FILTER
    // ==========================================
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(`${startDate}T00:00:00`);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(`${endDate}T23:59:59.999`);
      }
    }

    // ==========================================
    // PAGINATION
    // ==========================================
    const currentPage = Math.max(Number(page), 1);
    const pageLimit = Math.min(Math.max(Number(limit), 1), 100);

    const skip = (currentPage - 1) * pageLimit;

    // ==========================================
    // FETCH DATA
    // ==========================================
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate("company", "companyName companyCode")
        .populate("assignedCounselor", "fullName email")
        .populate("createdBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),

      Lead.countDocuments(filter),
    ]);

    // ==========================================
    // RESPONSE
    // ==========================================
    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit),
        hasNextPage: currentPage < Math.ceil(total / pageLimit),
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Get Leads Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error.message,
    });
  }
};