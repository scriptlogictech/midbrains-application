
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
  return typeof time === "string" &&
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
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

  const durationMinutes = endTotalMinutes - startTotalMinutes;

  return Number((durationMinutes / 60).toFixed(2));
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
        message: "Work name, date, start time and end time are required",
      });
    }

    // Validate time format
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Time must be in HH:mm format",
      });
    }

    // Calculate duration
    const totalDuration = calculateDuration(startTime, endTime);

    if (totalDuration === null) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // Validate date
    const workDate = new Date(date);

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
        const start = new Date(startDate);

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
        const end = new Date(endDate);

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
// DEPRECATED: TASK WORK LOGS
// ============================================================

exports.getTaskWorkLogs = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Task-based work logs are no longer supported",
  });
};