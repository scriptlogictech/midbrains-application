
const mongoose = require("mongoose");
const InstagramReelData = require("../models/InstagramReelData");
const User = require("../models/User");
const Company = require("../models/Company");

// ============================================================
// CHECK SUPER ADMIN
// ============================================================

const isSuperAdmin = (req) => {
    return req.user?.role === "super_admin";
};

// ============================================================
// GET LOGGED-IN USER'S COMPANY ID
// ============================================================

const getUserCompanyId = (req) => {
    const company = req.user?.company;

    if (!company) {
        return null;
    }

    if (typeof company === "object" && company._id) {
        return company._id.toString();
    }

    return company.toString();
};

// ============================================================
// GET COMPANY FILTER BASED ON USER ROLE
// ============================================================

const getCompanyFilter = (req) => {
    if (isSuperAdmin(req)) {
        return {};
    }

    const companyId = getUserCompanyId(req);

    if (!companyId) {
        return null;
    }

    return { company: companyId };
};

// ============================================================
// CREATE INSTAGRAM REEL DATA
// ============================================================

exports.createInstagramReelData = async (req, res) => {
    try {
        let companyId;

        if (isSuperAdmin(req)) {
            companyId = req.body.company;
        } else {
            companyId = getUserCompanyId(req);
        }

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "Company is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid company ID",
            });
        }

        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        const {
            name,
            contactNumber,
            email,
            lookingFor,
            resumeLink,
        } = req.body;

        if (!name || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "Name and contact number are required",
            });
        }

        const newRecord = await InstagramReelData.create({
            company: companyId,
            name: name.trim(),
            contactNumber: contactNumber.trim(),
            email: email?.trim() || "",
            lookingFor: lookingFor || "Job",
            resumeLink: resumeLink?.trim() || "",
            createdBy: req.user._id,
        });

        const populatedRecord = await InstagramReelData.findById(
            newRecord._id
        )
            .populate("company", "companyName companyCode")
            .populate("createdBy", "fullName email role")
            .populate(
                "followUps.assignedEmployee",
                "fullName email role"
            )
            .populate("followUps.createdBy", "fullName email role");

        return res.status(201).json({
            success: true,
            message: "Instagram Reel Data created successfully",
            data: populatedRecord,
        });
    } catch (error) {
        console.error("Create Instagram Reel Data Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create Instagram Reel Data",
            error: error.message,
        });
    }
};

// ============================================================
// GET ALL INSTAGRAM REEL DATA
// ============================================================

exports.getInstagramReelData = async (req, res) => {
    try {
        const companyFilter = getCompanyFilter(req);

        if (companyFilter === null) {
            return res.status(400).json({
                success: false,
                message: "Company not found",
            });
        }

        const records = await InstagramReelData.find(companyFilter)
            .populate("company", "companyName companyCode")
            .populate("createdBy", "fullName email role")
            .populate(
                "followUps.assignedEmployee",
                "fullName email role"
            )
            .populate("followUps.createdBy", "fullName email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: records.length,
            data: records,
        });
    } catch (error) {
        console.error("Get Instagram Reel Data Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch Instagram Reel Data",
            error: error.message,
        });
    }
};

// ============================================================
// GET SINGLE INSTAGRAM REEL DATA RECORD
// ============================================================

exports.getSingleInstagramReelData = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid record ID",
            });
        }

        const companyFilter = getCompanyFilter(req);

        if (companyFilter === null) {
            return res.status(400).json({
                success: false,
                message: "Company not found",
            });
        }

        const record = await InstagramReelData.findOne({
            _id: id,
            ...companyFilter,
        })
            .populate("company", "companyName companyCode")
            .populate("createdBy", "fullName email role")
            .populate(
                "followUps.assignedEmployee",
                "fullName email role"
            )
            .populate("followUps.createdBy", "fullName email role");

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error) {
        console.error("Get Single Instagram Reel Data Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch record",
            error: error.message,
        });
    }
};

// ============================================================
// UPDATE INSTAGRAM REEL DATA
// ============================================================

exports.updateInstagramReelData = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid record ID",
            });
        }

        const companyFilter = getCompanyFilter(req);

        if (companyFilter === null) {
            return res.status(400).json({
                success: false,
                message: "Company not found",
            });
        }

        const allowedFields = [
            "name",
            "contactNumber",
            "email",
            "lookingFor",
            "resumeLink",
        ];

        const updateData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const updatedRecord =
            await InstagramReelData.findOneAndUpdate(
                {
                    _id: id,
                    ...companyFilter,
                },
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            )
                .populate("company", "companyName companyCode")
                .populate("createdBy", "fullName email role")
                .populate(
                    "followUps.assignedEmployee",
                    "fullName email role"
                )
                .populate("followUps.createdBy", "fullName email role");

        if (!updatedRecord) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Record updated successfully",
            data: updatedRecord,
        });
    } catch (error) {
        console.error("Update Instagram Reel Data Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update record",
            error: error.message,
        });
    }
};

// ============================================================
// DELETE INSTAGRAM REEL DATA
// ============================================================

exports.deleteInstagramReelData = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid record ID",
            });
        }

        const companyFilter = getCompanyFilter(req);

        if (companyFilter === null) {
            return res.status(400).json({
                success: false,
                message: "Company not found",
            });
        }

        const deletedRecord =
            await InstagramReelData.findOneAndDelete({
                _id: id,
                ...companyFilter,
            });

        if (!deletedRecord) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Record deleted successfully",
        });
    } catch (error) {
        console.error("Delete Instagram Reel Data Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete record",
            error: error.message,
        });
    }
};

// ============================================================
// GET EMPLOYEES AND INTERNS
// ============================================================

exports.getCompanyEmployees = async (req, res) => {
    try {
        let employeeFilter = {
            role: {
                $in: ["employee", "intern"],
            },
            isActive: true,
        };

        // Super Admin can see employees and interns
        // from all three companies.
        if (!isSuperAdmin(req)) {
            const companyId = getUserCompanyId(req);

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: "Company not found",
                });
            }

            employeeFilter.company = companyId;
        }

        const employees = await User.find(employeeFilter)
            .select("_id fullName email role company")
            .populate("company", "companyName companyCode")
            .sort({ fullName: 1 });

        return res.status(200).json({
            success: true,
            data: employees,
        });
    } catch (error) {
        console.error("Get Company Employees Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch employees",
            error: error.message,
        });
    }
};

// ============================================================
// ADD FOLLOW-UP
// ============================================================

exports.addFollowUp = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            assignedEmployee,
            nextFollowUpDate,
            status,
            communicationNotes,
        } = req.body;

        // Validate record ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid record ID",
            });
        }

        // Validate required fields
        if (!assignedEmployee || !nextFollowUpDate) {
            return res.status(400).json({
                success: false,
                message:
                    "Assigned employee and next follow-up date are required",
            });
        }

        // Validate employee ID
        if (!mongoose.Types.ObjectId.isValid(assignedEmployee)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID",
            });
        }

        // Validate follow-up date
        const followUpDate = new Date(nextFollowUpDate);

        if (Number.isNaN(followUpDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid follow-up date",
            });
        }

        // Get company filter
        const companyFilter = getCompanyFilter(req);

        if (companyFilter === null) {
            return res.status(400).json({
                success: false,
                message: "Company not found",
            });
        }

        // Find the lead/record
        const record = await InstagramReelData.findOne({
            _id: id,
            ...companyFilter,
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }

        // ========================================================
        // UPDATED EMPLOYEE VALIDATION
        // ========================================================
        // Employees and interns can work across all three companies.
        // Therefore, do not filter by record.company.
        // Validate only the employee ID, role, and active status.
        // ========================================================

        const employee = await User.findOne({
            _id: assignedEmployee,
            role: {
                $in: ["employee", "intern"],
            },
            isActive: true,
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message:
                    "Employee or intern not found or inactive",
            });
        }

        const followUpStatus = status || "Pending";

        // Add follow-up
        record.followUps.push({
            assignedEmployee,
            nextFollowUpDate: followUpDate,
            status: followUpStatus,
            communicationNotes: communicationNotes || "",
            communicationDate: new Date(),
            createdBy: req.user._id,
        });

        // Update main record follow-up details
        record.lastFollowUpDate = new Date();
        record.nextFollowUpDate = followUpDate;
        record.followUpStatus = followUpStatus;

        await record.save();

        // Populate updated record
        const populatedRecord = await InstagramReelData.findById(
            record._id
        )
            .populate("company", "companyName companyCode")
            .populate("createdBy", "fullName email role")
            .populate(
                "followUps.assignedEmployee",
                "fullName email role"
            )
            .populate("followUps.createdBy", "fullName email role");

        return res.status(201).json({
            success: true,
            message: "Follow-up added successfully",
            data: populatedRecord,
        });
    } catch (error) {
        console.error("Add Follow-up Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add follow-up",
            error: error.message,
        });
    }
};