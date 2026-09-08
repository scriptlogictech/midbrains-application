const WorkTask = require("../models/WorkTask");
const User = require("../models/User");
const Company = require("../models/Company");

// ========================================
// CREATE WORK TASK
// Super Admin only
// ========================================

exports.createWorkTask = async (req, res) => {
  try {
    const {
      company,
      title,
      description,
      assignedTo,
      priority,
      startDate,
      deadline,
      estimatedHours,
      remarks,
    } = req.body;

    if (
      !company ||
      !title ||
      !assignedTo ||
      !startDate ||
      !deadline
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Company, title, assigned employee/intern, start date and deadline are required",
      });
    }

    // Check company
    const companyExists = await Company.findById(company);

    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check assigned user
    const assignedUser = await User.findById(assignedTo);

    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: "Assigned employee/intern not found",
      });
    }

    // Only employee or intern can receive work
    if (
      assignedUser.role !== "employee" &&
      assignedUser.role !== "intern"
    ) {
      return res.status(400).json({
        success: false,
        message: "Work can only be assigned to an employee or intern",
      });
    }

    // User must belong to same company
    if (
      !assignedUser.company ||
      assignedUser.company.toString() !== company.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee/intern does not belong to the selected company",
      });
    }

    if (!assignedUser.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign work to an inactive employee/intern",
      });
    }

    // Validate dates
    if (new Date(deadline) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before start date",
      });
    }

    const task = await WorkTask.create({
      company,
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority: priority || "medium",
      status: "pending",
      progress: 0,
      startDate,
      deadline,
      estimatedHours: estimatedHours || 0,
      remarks,
    });

    const populatedTask = await WorkTask.findById(task._id)
      .populate("company", "companyName companyCode")
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role");

    res.status(201).json({
      success: true,
      message: "Work assigned successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("Create Work Task Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET ALL WORK TASKS
// Super Admin
// ========================================

exports.getWorkTasks = async (req, res) => {
  try {
    const { companyId, assignedTo, status, priority } = req.query;

    const filter = {};

    if (companyId) {
      filter.company = companyId;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    const tasks = await WorkTask.find(filter)
      .populate("company", "companyName companyCode")
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get Work Tasks Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET MY WORK
// Employee / Intern
// ========================================

exports.getMyWork = async (req, res) => {
  try {
    const tasks = await WorkTask.find({
      assignedTo: req.user._id,
      company: req.user.company,
    })
      .populate("company", "companyName companyCode")
      .populate("assignedBy", "fullName email role")
      .sort({
        status: 1,
        deadline: 1,
      });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get My Work Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET SINGLE WORK TASK
// ========================================

exports.getWorkTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await WorkTask.findById(id)
      .populate("company", "companyName companyCode")
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Work task not found",
      });
    }

    // Employee / Intern can only see their own task
    if (
      req.user.role === "employee" ||
      req.user.role === "intern"
    ) {
      if (
        task.assignedTo._id.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get Work Task Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// UPDATE WORK TASK
// Super Admin
// ========================================

exports.updateWorkTask = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      assignedTo,
      priority,
      startDate,
      deadline,
      estimatedHours,
      remarks,
    } = req.body;

    const task = await WorkTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Work task not found",
      });
    }

    if (title !== undefined) {
      task.title = title;
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (priority !== undefined) {
      if (
        !["low", "medium", "high", "urgent"].includes(priority)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority",
        });
      }

      task.priority = priority;
    }

    if (startDate !== undefined) {
      task.startDate = startDate;
    }

    if (deadline !== undefined) {
      task.deadline = deadline;
    }

    if (estimatedHours !== undefined) {
      task.estimatedHours = estimatedHours;
    }

    if (remarks !== undefined) {
      task.remarks = remarks;
    }

    // Reassign employee/intern
    if (assignedTo !== undefined) {
      const assignedUser = await User.findById(assignedTo);

      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Employee/intern not found",
        });
      }

      if (
        assignedUser.role !== "employee" &&
        assignedUser.role !== "intern"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Work can only be assigned to an employee or intern",
        });
      }

      if (
        !assignedUser.company ||
        assignedUser.company.toString() !==
          task.company.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Employee/intern does not belong to this company",
        });
      }

      task.assignedTo = assignedTo;
    }

    const finalStartDate = new Date(task.startDate);
    const finalDeadline = new Date(task.deadline);

    if (finalDeadline < finalStartDate) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before start date",
      });
    }

    await task.save();

    const updatedTask = await WorkTask.findById(task._id)
      .populate("company", "companyName companyCode")
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role");

    res.status(200).json({
      success: true,
      message: "Work task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Work Task Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// UPDATE WORK STATUS / PROGRESS
// Employee / Intern
// ========================================

exports.updateWorkProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      progress,
      status,
    } = req.body;

    const task = await WorkTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Work task not found",
      });
    }

    // Employee / Intern can only update their own task
    if (
      task.assignedTo.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your assigned work",
      });
    }

    if (progress !== undefined) {
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

      task.progress = numericProgress;

      if (numericProgress === 100) {
        task.status = "completed";
      } else if (numericProgress > 0) {
        task.status = "in_progress";
      } else {
        task.status = "pending";
      }
    }

    if (status !== undefined) {
      const allowedStatuses = [
        "pending",
        "in_progress",
        "on_hold",
        "completed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      task.status = status;

      if (status === "completed") {
        task.progress = 100;
      }
    }

    await task.save();

    const updatedTask = await WorkTask.findById(task._id)
      .populate("company", "companyName companyCode")
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role");

    res.status(200).json({
      success: true,
      message: "Work progress updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Work Progress Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// DELETE WORK TASK
// Super Admin
// ========================================

exports.deleteWorkTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await WorkTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Work task not found",
      });
    }

    await WorkTask.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Work task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Work Task Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};