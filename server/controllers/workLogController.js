const WorkLog = require("../models/WorkLog");
const WorkTask = require("../models/WorkTask");

// ============================================================
// HELPER: GET USER COMPANY ID
// ============================================================
// authMiddleware.js populates req.user.company.
//
// Therefore req.user.company can be:
// 1. ObjectId
// 2. Populated Company document
//
// This helper always returns the actual company ID.
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
// CREATE DAILY WORK LOG
// Employee / Intern
// ============================================================

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

    // --------------------------------------------------------
    // FIND WORK TASK
    // --------------------------------------------------------

    const workTask = await WorkTask.findById(task);

    if (!workTask) {
      return res.status(404).json({
        success: false,
        message: "Work task not found",
      });
    }

    // --------------------------------------------------------
    // EMPLOYEE / INTERN CAN ONLY LOG THEIR OWN TASK
    // --------------------------------------------------------

    if (
      !workTask.assignedTo ||
      workTask.assignedTo.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only add work logs for your assigned work",
      });
    }

    // --------------------------------------------------------
    // COMPANY ISOLATION
    // --------------------------------------------------------

    const userCompanyId =
      getUserCompanyId(req);

    if (!userCompanyId) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned to a company",
      });
    }

    const taskCompanyId =
      workTask.company
        ? workTask.company.toString()
        : null;

    if (
      !taskCompanyId ||
      taskCompanyId !== userCompanyId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // --------------------------------------------------------
    // VALIDATE PROGRESS
    // --------------------------------------------------------

    const numericProgress =
      Number(progress);

    if (
      Number.isNaN(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Progress must be between 0 and 100",
      });
    }

    // --------------------------------------------------------
    // VALIDATE HOURS
    // --------------------------------------------------------

    const numericHours =
      Number(hoursWorked || 0);

    if (
      Number.isNaN(numericHours) ||
      numericHours < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hours worked cannot be negative",
      });
    }

    // --------------------------------------------------------
    // CREATE WORK LOG
    // --------------------------------------------------------

    const workLog =
      await WorkLog.create({
        company: taskCompanyId,
        task,
        employee: req.user._id,
        date: date || new Date(),
        progress: numericProgress,
        hoursWorked: numericHours,
        workDescription,
        blockers,
        nextPlan,
      });

    // --------------------------------------------------------
    // KEEP MAIN TASK PROGRESS SYNCHRONIZED
    // --------------------------------------------------------

    workTask.progress =
      numericProgress;

    if (numericProgress === 100) {
      workTask.status = "completed";
    } else if (numericProgress > 0) {
      workTask.status = "in_progress";
    } else {
      workTask.status = "pending";
    }

    await workTask.save();

    // --------------------------------------------------------
    // POPULATE WORK LOG
    // --------------------------------------------------------

    const populatedLog =
      await WorkLog.findById(
        workLog._id
      )
        .populate(
          "task",
          "title status progress deadline"
        )
        .populate(
          "employee",
          "fullName email role"
        )
        .populate(
          "company",
          "companyName companyCode"
        );

    return res.status(201).json({
      success: true,
      message:
        "Work log added successfully",
      workLog: populatedLog,
    });
  } catch (error) {
    console.error(
      "Create Work Log Error:",
      error
    );

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

exports.getMyWorkLogs = async (
  req,
  res
) => {
  try {
    const userCompanyId =
      getUserCompanyId(req);

    if (!userCompanyId) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned to a company",
      });
    }

    const logs =
      await WorkLog.find({
        employee: req.user._id,
        company: userCompanyId,
      })
        .populate(
          "task",
          "title status progress deadline"
        )
        .populate(
          "company",
          "companyName companyCode"
        )
        .sort({
          date: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error(
      "Get My Work Logs Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET LOGS FOR A TASK
// ============================================================

exports.getTaskWorkLogs = async (
  req,
  res
) => {
  try {
    const { taskId } =
      req.params;

    const task =
      await WorkTask.findById(
        taskId
      );

    if (!task) {
      return res.status(404).json({
        success: false,
        message:
          "Work task not found",
      });
    }

    // --------------------------------------------------------
    // EMPLOYEE / INTERN ACCESS
    // --------------------------------------------------------

    if (
      req.user.role === "employee" ||
      req.user.role === "intern"
    ) {
      // Only their own assigned task
      if (
        !task.assignedTo ||
        task.assignedTo.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied",
        });
      }

      // Company isolation
      const userCompanyId =
        getUserCompanyId(req);

      const taskCompanyId =
        task.company
          ? task.company.toString()
          : null;

      if (
        !userCompanyId ||
        !taskCompanyId ||
        taskCompanyId !==
          userCompanyId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied",
        });
      }
    }

    // --------------------------------------------------------
    // GET LOGS
    // --------------------------------------------------------

    const logs =
      await WorkLog.find({
        task: taskId,
        company: task.company,
      })
        .populate(
          "employee",
          "fullName email role"
        )
        .populate(
          "task",
          "title status progress deadline"
        )
        .sort({
          date: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error(
      "Get Task Work Logs Error:",
      error
    );

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

exports.getAllWorkLogs = async (
  req,
  res
) => {
  try {
    const {
      companyId,
      employeeId,
      taskId,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    // --------------------------------------------------------
    // COMPANY FILTER
    // --------------------------------------------------------

    if (companyId) {
      filter.company = companyId;
    }

    // --------------------------------------------------------
    // EMPLOYEE FILTER
    // --------------------------------------------------------

    if (employeeId) {
      filter.employee =
        employeeId;
    }

    // --------------------------------------------------------
    // TASK FILTER
    // --------------------------------------------------------

    if (taskId) {
      filter.task = taskId;
    }

    // --------------------------------------------------------
    // DATE FILTER
    // --------------------------------------------------------

    if (
      startDate ||
      endDate
    ) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte =
          new Date(startDate);
      }

      if (endDate) {
        const end =
          new Date(endDate);

        end.setHours(
          23,
          59,
          59,
          999
        );

        filter.date.$lte =
          end;
      }
    }

    // --------------------------------------------------------
    // GET LOGS
    // --------------------------------------------------------

    const logs =
      await WorkLog.find(filter)
        .populate(
          "employee",
          "fullName email role"
        )
        .populate(
          "task",
          "title status progress deadline"
        )
        .populate(
          "company",
          "companyName companyCode"
        )
        .sort({
          date: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error(
      "Get All Work Logs Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};