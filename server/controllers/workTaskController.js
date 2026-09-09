const WorkTask = require("../models/WorkTask");
const User = require("../models/User");

/* =========================================================
   CREATE WORK TASK - SUPER ADMIN
========================================================= */

const createWorkTask = async (req, res) => {
    try {
        const {
            company,
            title,
            description,
            assignedTo,
            priority,
            status,
            progress,
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
                    "Company, title, assigned user, start date and deadline are required.",
            });
        }

        const assignedUser = await User.findOne({
            _id: assignedTo,
            company,
            isActive: true,
            role: {
                $in: ["employee", "intern"],
            },
        });

        if (!assignedUser) {
            return res.status(400).json({
                success: false,
                message:
                    "Assigned user must be an active employee or intern of the selected company.",
            });
        }

        if (new Date(deadline) < new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message:
                    "Deadline cannot be before start date.",
            });
        }

        const task = await WorkTask.create({
            company,
            title: title.trim(),
            description: description?.trim(),
            workType: "assigned",

            assignedTo,

            assignedBy: req.user._id,
            createdBy: req.user._id,

            priority: priority || "medium",
            status: status || "pending",
            progress:
                progress !== undefined
                    ? Number(progress)
                    : 0,

            startDate,
            deadline,

            estimatedHours:
                estimatedHours !== undefined
                    ? Number(estimatedHours)
                    : 0,

            remarks: remarks?.trim(),
        });

        const populatedTask = await WorkTask.findById(
            task._id
        )
            .populate(
                "assignedTo",
                "fullName email role"
            )
            .populate(
                "assignedBy",
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

        return res.status(201).json({
            success: true,
            message: "Work task created successfully.",
            task: populatedTask,
        });
    } catch (error) {
        console.error(
            "Create Work Task Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create work task.",
        });
    }
};


/* =========================================================
   CREATE SELF WORK - EMPLOYEE / INTERN
========================================================= */

const createSelfWork = async (req, res) => {
    try {
        const {
            title,
            description,
            date,
            startTime,
            endTime,
            hoursWorked,
            progress,
            status,
            priority,
            remarks,
        } = req.body;

        if (!title || !date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message:
                    "Title, date, start time and end time are required.",
            });
        }

        if (
            !req.user.company ||
            !req.user._id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "User company information is missing.",
            });
        }

        /*
         * Employee/Intern can only create work
         * for themselves.
         */

        let calculatedHours = 0;

        const start = startTime.split(":");
        const end = endTime.split(":");

        if (
            start.length === 2 &&
            end.length === 2
        ) {
            const startMinutes =
                Number(start[0]) * 60 +
                Number(start[1]);

            const endMinutes =
                Number(end[0]) * 60 +
                Number(end[1]);

            let difference =
                endMinutes - startMinutes;

            /*
             * Supports work crossing midnight.
             */
            if (difference < 0) {
                difference += 24 * 60;
            }

            calculatedHours =
                Number(
                    (difference / 60).toFixed(2)
                );
        }

        const finalHours =
            hoursWorked !== undefined &&
            hoursWorked !== ""
                ? Number(hoursWorked)
                : calculatedHours;

        let finalProgress =
            progress !== undefined
                ? Number(progress)
                : 0;

        if (finalProgress < 0) {
            finalProgress = 0;
        }

        if (finalProgress > 100) {
            finalProgress = 100;
        }

        let finalStatus = status || "pending";

        if (finalProgress === 100) {
            finalStatus = "completed";
        } else if (finalProgress > 0) {
            finalStatus = "in_progress";
        }

        /*
         * For self work:
         *
         * startDate = selected date
         * deadline  = selected date
         */

        const workDate = new Date(date);

        const task = await WorkTask.create({
            company: req.user.company,

            title: title.trim(),
            description: description?.trim(),

            workType: "self",

            assignedTo: req.user._id,

            /*
             * No Super Admin assignment.
             */
            assignedBy: null,

            createdBy: req.user._id,

            priority: priority || "medium",

            status: finalStatus,

            progress: finalProgress,

            startDate: workDate,
            deadline: workDate,

            startTime,
            endTime,

            estimatedHours: 0,

            hoursWorked: finalHours,

            remarks: remarks?.trim(),
        });

        const populatedTask =
            await WorkTask.findById(task._id)
                .populate(
                    "assignedTo",
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

        return res.status(201).json({
            success: true,
            message:
                "Your work has been added successfully.",
            task: populatedTask,
        });
    } catch (error) {
        console.error(
            "Create Self Work Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to add your work.",
        });
    }
};


/* =========================================================
   GET ALL WORK TASKS - SUPER ADMIN
========================================================= */

const getWorkTasks = async (req, res) => {
    try {
        const {
            companyId,
            assignedTo,
            status,
            priority,
            workType,
        } = req.query;

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

        if (workType) {
            filter.workType = workType;
        }

        const tasks = await WorkTask.find(filter)
            .populate(
                "assignedTo",
                "fullName email role"
            )
            .populate(
                "assignedBy",
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

        return res.status(200).json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error(
            "Get Work Tasks Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch work tasks.",
        });
    }
};


/* =========================================================
   GET MY WORK - EMPLOYEE / INTERN
========================================================= */

const getMyWork = async (req, res) => {
    try {
        const tasks = await WorkTask.find({
            assignedTo: req.user._id,
            company: req.user.company,
        })
            .populate(
                "assignedBy",
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
                startDate: -1,
                createdAt: -1,
            });

        return res.status(200).json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error(
            "Get My Work Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch your work.",
        });
    }
};


/* =========================================================
   GET SINGLE WORK TASK
========================================================= */

const getWorkTaskById = async (req, res) => {
    try {
        const task =
            await WorkTask.findById(req.params.id)
                .populate(
                    "assignedTo",
                    "fullName email role"
                )
                .populate(
                    "assignedBy",
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

        if (!task) {
            return res.status(404).json({
                success: false,
                message:
                    "Work task not found.",
            });
        }

        /*
         * Employee/Intern can only see
         * their own work.
         */

        if (
            ["employee", "intern"].includes(
                req.user.role
            )
        ) {
            if (
                String(task.assignedTo?._id) !==
                    String(req.user._id) ||
                String(task.company?._id) !==
                    String(req.user.company)
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to view this work.",
                });
            }
        }

        return res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        console.error(
            "Get Work Task Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch work task.",
        });
    }
};


/* =========================================================
   UPDATE WORK TASK - SUPER ADMIN
========================================================= */

const updateWorkTask = async (req, res) => {
    try {
        const task =
            await WorkTask.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message:
                    "Work task not found.",
            });
        }

        const {
            company,
            title,
            description,
            assignedTo,
            priority,
            status,
            progress,
            startDate,
            deadline,
            estimatedHours,
            remarks,
        } = req.body;

        if (
            assignedTo &&
            String(assignedTo) !==
                String(task.assignedTo)
        ) {
            const assignedUser =
                await User.findOne({
                    _id: assignedTo,
                    company:
                        company || task.company,
                    isActive: true,
                    role: {
                        $in: [
                            "employee",
                            "intern",
                        ],
                    },
                });

            if (!assignedUser) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Assigned user must be an active employee or intern of the selected company.",
                });
            }
        }

        const finalStartDate =
            startDate || task.startDate;

        const finalDeadline =
            deadline || task.deadline;

        if (
            new Date(finalDeadline) <
            new Date(finalStartDate)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Deadline cannot be before start date.",
            });
        }

        task.company =
            company || task.company;

        task.title =
            title?.trim() || task.title;

        task.description =
            description?.trim();

        task.assignedTo =
            assignedTo || task.assignedTo;

        task.priority =
            priority || task.priority;

        task.status =
            status || task.status;

        if (progress !== undefined) {
            task.progress = Number(progress);

            if (task.progress === 100) {
                task.status = "completed";
            } else if (
                task.progress > 0
            ) {
                task.status = "in_progress";
            } else {
                task.status = "pending";
            }
        }

        task.startDate = finalStartDate;
        task.deadline = finalDeadline;

        if (
            estimatedHours !== undefined
        ) {
            task.estimatedHours =
                Number(estimatedHours);
        }

        task.remarks =
            remarks?.trim();

        await task.save();

        const updatedTask =
            await WorkTask.findById(task._id)
                .populate(
                    "assignedTo",
                    "fullName email role"
                )
                .populate(
                    "assignedBy",
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

        return res.status(200).json({
            success: true,
            message:
                "Work task updated successfully.",
            task: updatedTask,
        });
    } catch (error) {
        console.error(
            "Update Work Task Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update work task.",
        });
    }
};


/* =========================================================
   UPDATE WORK PROGRESS - EMPLOYEE / INTERN
========================================================= */

const updateWorkProgress = async (
    req,
    res
) => {
    try {
        const { progress, remarks } =
            req.body;

        const task =
            await WorkTask.findById(
                req.params.id
            );

        if (!task) {
            return res.status(404).json({
                success: false,
                message:
                    "Work task not found.",
            });
        }

        /*
         * Employee/Intern can only update
         * their own work.
         */

        if (
            String(task.assignedTo) !==
                String(req.user._id) ||
            String(task.company) !==
                String(req.user.company)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to update this work.",
            });
        }

        const numericProgress =
            Number(progress);

        if (
            Number.isNaN(
                numericProgress
            ) ||
            numericProgress < 0 ||
            numericProgress > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Progress must be between 0 and 100.",
            });
        }

        task.progress =
            numericProgress;

        if (
            numericProgress === 100
        ) {
            task.status = "completed";
        } else if (
            numericProgress > 0
        ) {
            task.status = "in_progress";
        } else {
            task.status = "pending";
        }

        if (remarks !== undefined) {
            task.remarks =
                remarks?.trim();
        }

        await task.save();

        const updatedTask =
            await WorkTask.findById(
                task._id
            )
                .populate(
                    "assignedTo",
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

        return res.status(200).json({
            success: true,
            message:
                "Work progress updated successfully.",
            task: updatedTask,
        });
    } catch (error) {
        console.error(
            "Update Work Progress Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update work progress.",
        });
    }
};


/* =========================================================
   DELETE WORK TASK - SUPER ADMIN
========================================================= */

const deleteWorkTask = async (req, res) => {
    try {
        const task =
            await WorkTask.findById(
                req.params.id
            );

        if (!task) {
            return res.status(404).json({
                success: false,
                message:
                    "Work task not found.",
            });
        }

        await WorkTask.findByIdAndDelete(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Work task deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Work Task Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete work task.",
        });
    }
};


module.exports = {
    createWorkTask,
    createSelfWork,
    getWorkTasks,
    getMyWork,
    getWorkTaskById,
    updateWorkTask,
    updateWorkProgress,
    deleteWorkTask,
};