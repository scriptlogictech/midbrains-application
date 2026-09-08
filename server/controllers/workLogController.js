const WorkLog = require("../models/WorkLog");
const WorkTask = require("../models/WorkTask");

// ========================================
// CREATE DAILY WORK LOG
// Employee / Intern
// ========================================

exports.createWorkLog = async (req, res) => {
  try {
    const {
      task,
      date,
      progress,
      hoursWorked,
      workDescription,
      blockers,
      nextPlan,
    } = req.body;

    if (
      !task ||
      progress === undefined ||
      !workDescription
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task, progress and work description are required",
      });
    }

    const workTask = await WorkTask.findById(task);

    if (!workTask) {
      return res.status(404).json({
        success: false,
        message: "Work task not found",
      });
    }

    // Employee / Intern can only log their own task
    if (
      workTask.assignedTo.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only add work logs for your assigned work",
      });
    }

    // Company isolation
    if (
      !req.user.company ||
      workTask.company.toString() !==
        req.user.company.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const numericProgress = Number(progress);

    if (
      Number.isNaN(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Progress must be between 0 and 100",
      });
    }

    const numericHours = Number(hoursWorked || 0);

    if (numericHours < 0) {
      return res.status(400).json({
        success: false,
        message: "Hours worked cannot be negative",
      });
    }

    const workLog = await WorkLog.create({
      company: workTask.company,
      task,
      employee: req.user._id,
      date: date || new Date(),
      progress: numericProgress,
      hoursWorked: numericHours,
      workDescription,
      blockers,
      nextPlan,
    });

    // Keep main task progress synchronized
    workTask.progress = numericProgress;

    if (numericProgress === 100) {
      workTask.status = "completed";
    } else if (numericProgress > 0) {
      workTask.status = "in_progress";
    } else {
      workTask.status = "pending";
    }

    await workTask.save();

    const populatedLog = await WorkLog.findById(workLog._id)
      .populate("task", "title status progress deadline")
      .populate("employee", "fullName email role")
      .populate("company", "companyName companyCode");

    res.status(201).json({
      success: true,
      message: "Work log added successfully",
      workLog: populatedLog,
    });
  } catch (error) {
    console.error("Create Work Log Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET MY WORK LOGS
// Employee / Intern
// ========================================

exports.getMyWorkLogs = async (req, res) => {
  try {
    const logs = await WorkLog.find({
      employee: req.user._id,
      company: req.user.company,
    })
      .populate("task", "title status progress deadline")
      .populate("company", "companyName companyCode")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Get My Work Logs Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET LOGS FOR A TASK
// ========================================

exports.getTaskWorkLogs = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await WorkTask.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Work task not found",
      });
    }

    // Employee / Intern can only see logs of own task
    if (
      req.user.role === "employee" ||
      req.user.role === "intern"
    ) {
      if (
        task.assignedTo.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    const logs = await WorkLog.find({
      task: taskId,
      company: task.company,
    })
      .populate("employee", "fullName email role")
      .populate("task", "title status progress deadline")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Get Task Work Logs Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET ALL WORK LOGS
// Super Admin
// ========================================

exports.getAllWorkLogs = async (req, res) => {
  try {
    const {
      companyId,
      employeeId,
      taskId,
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

    if (taskId) {
      filter.task = taskId;
    }

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const logs = await WorkLog.find(filter)
      .populate("employee", "fullName email role")
      .populate("task", "title status progress deadline")
      .populate("company", "companyName companyCode")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Get All Work Logs Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};