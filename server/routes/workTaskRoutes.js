const express = require("express");

const router = express.Router();

const {
    createWorkTask,
    createSelfWork,
    getWorkTasks,
    getMyWork,
    getWorkTaskById,
    updateWorkTask,
    updateWorkProgress,
    deleteWorkTask,
} = require("../controllers/workTaskController");

const {
    protect,
} = require("../middlewares/authMiddleware");

const {
    authorizeRoles,
} = require("../middlewares/roleMiddleware");


/* =========================================================
   SUPER ADMIN
========================================================= */

/*
 * Create task and assign to Employee/Intern
 */
router.post(
    "/",
    protect,
    authorizeRoles("super_admin"),
    createWorkTask
);


/*
 * Get all work tasks
 */
router.get(
    "/",
    protect,
    authorizeRoles("super_admin"),
    getWorkTasks
);


/*
 * Update assigned task
 */
router.put(
    "/:id",
    protect,
    authorizeRoles("super_admin"),
    updateWorkTask
);


/*
 * Delete task
 */
router.delete(
    "/:id",
    protect,
    authorizeRoles("super_admin"),
    deleteWorkTask
);


/* =========================================================
   EMPLOYEE / INTERN
========================================================= */

/*
 * Add work for themselves
 */
router.post(
    "/self",
    protect,
    authorizeRoles("employee", "intern"),
    createSelfWork
);


/*
 * Get their own work
 */
router.get(
    "/my-work",
    protect,
    authorizeRoles("employee", "intern"),
    getMyWork
);


/*
 * Update their own progress
 */
router.put(
    "/:id/progress",
    protect,
    authorizeRoles("employee", "intern"),
    updateWorkProgress
);


/* =========================================================
   SHARED
========================================================= */

router.get(
    "/:id",
    protect,
    authorizeRoles(
        "super_admin",
        "employee",
        "intern"
    ),
    getWorkTaskById
);


module.exports = router;