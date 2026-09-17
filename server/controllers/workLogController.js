
const mongoose = require("mongoose");
const WorkLog = require("../models/WorkLog");

// ============================================================
// HELPER: GET USER COMPANY ID
// ============================================================

const getUserCompanyId = (req) => {
  if (!req.user || !req.user.company) {
    return null;
  }

  if (req.user.company._id) {
    return req.user.company._id.toString();
  }

  return req.user.company.toString();
};

// ============================================================
// HELPER: VALIDATE TIME FORMAT
// ============================================================

const isValidTime = (time) => {
  return (
    typeof time === "string" &&
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)
  );
};

// ============================================================
// HELPER: CALCULATE TOTAL DURATION
// ============================================================

const calculateDuration = (startTime, endTime) => {
  const [startHours, startMinutes] = startTime
    .split(":")
    .map(Number);

  const [endHours, endMinutes] = endTime
    .split(":")
    .map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  if (endTotalMinutes <= startTotalMinutes) {
    return null;
  }

  const durationMinutes =
    endTotalMinutes - startTotalMinutes;

  return Number((durationMinutes / 60).toFixed(2));
};

// ============================================================
// HELPER: VALIDATE WORK LOG ID
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ============================================================
// CREATE DAILY WORK LOG
// Employee / Intern
// ============================================================

exports.createWorkLog = async (req, res) => {
  try {
    const {
      workName,
      date,
      startTime,
      endTime,
    } = req.body;

    // Validate required fields
    if (!workName || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Work name, date, start time and end time are required",
      });
    }

    // Validate time format
    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Time must be in HH:mm format",
      });
    }

    // Calculate duration
    const totalDuration = calculateDuration(
      startTime,
      endTime
    );

    if (totalDuration === null) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Validate date
    const workDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(workDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date",
      });
    }

    // Get employee company
    const companyId = getUserCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to a company",
      });
    }

    // Create work log
    const workLog = await WorkLog.create({
      company: companyId,
      employee: req.user._id,
      workName: workName.trim(),
      date: workDate,
      startTime,
      endTime,
      totalDuration,
    });

    // Populate employee and company details
    const populatedLog = await WorkLog.findById(workLog._id)
      .populate("employee", "fullName email role")
      .populate("company", "companyName companyCode");

    return res.status(201).json({
      success: true,
      message: "Work log added successfully",
      workLog: populatedLog,
    });
  } catch (error) {
    console.error("Create Work Log Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET MY WORK LOGS
// Employee / Intern
// ============================================================

exports.getMyWorkLogs = async (req, res) => {
  try {
    const companyId = getUserCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to a company",
      });
    }

    const logs = await WorkLog.find({
      employee: req.user._id,
      company: companyId,
    })
      .populate("company", "companyName companyCode")
      .sort({
        date: -1,
        startTime: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Get My Work Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET ALL WORK LOGS
// Super Admin
// ============================================================

exports.getAllWorkLogs = async (req, res) => {
  try {
    const {
      companyId,
      employeeId,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (companyId) {
      filter.company = companyId;
    }

    if (employeeId) {
      filter.employee = employeeId;
    }

    // Date filter
    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        start.setHours(0, 0, 0, 0);

        filter.date.$gte = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        end.setHours(23, 59, 59, 999);

        filter.date.$lte = end;
      }
    }

    const logs = await WorkLog.find(filter)
      .populate("employee", "fullName email role")
      .populate("company", "companyName companyCode")
      .sort({
        date: -1,
        startTime: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Get All Work Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// UPDATE WORK LOG
// Employee / Intern
// ============================================================

exports.updateWorkLog = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid work log ID",
      });
    }

    const {
      workName,
      date,
      startTime,
      endTime,
    } = req.body;

    // Validate required fields
    if (!workName || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Work name, date, start time and end time are required",
      });
    }

    // Validate time format
    if (
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Time must be in HH:mm format",
      });
    }

    // Calculate duration
    const totalDuration = calculateDuration(
      startTime,
      endTime
    );

    if (totalDuration === null) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Validate date
    const workDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(workDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date",
      });
    }

    // Get company ID
    const companyId = getUserCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to a company",
      });
    }

    // Find employee's own work log
    const workLog = await WorkLog.findOne({
      _id: id,
      employee: req.user._id,
      company: companyId,
    });

    if (!workLog) {
      return res.status(404).json({
        success: false,
        message: "Work log not found or access denied",
      });
    }

    // Update work log
    workLog.workName = workName.trim();
    workLog.date = workDate;
    workLog.startTime = startTime;
    workLog.endTime = endTime;
    workLog.totalDuration = totalDuration;

    await workLog.save();

    // Populate updated work log
    const updatedLog = await WorkLog.findById(workLog._id)
      .populate("employee", "fullName email role")
      .populate("company", "companyName companyCode");

    return res.status(200).json({
      success: true,
      message: "Work log updated successfully",
      workLog: updatedLog,
    });
  } catch (error) {
    console.error("Update Work Log Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE WORK LOG
// Employee / Intern
// ============================================================

exports.deleteWorkLog = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid work log ID",
      });
    }

    // Get company ID
    const companyId = getUserCompanyId(req);

    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to a company",
      });
    }

    // Delete only employee's own work log
    const workLog = await WorkLog.findOneAndDelete({
      _id: id,
      employee: req.user._id,
      company: companyId,
    });

    if (!workLog) {
      return res.status(404).json({
        success: false,
        message: "Work log not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Work log deleted successfully",
    });
  } catch (error) {
    console.error("Delete Work Log Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DEPRECATED: TASK WORK LOGS
// ============================================================

exports.getTaskWorkLogs = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Task-based work logs are no longer supported",
  });
};