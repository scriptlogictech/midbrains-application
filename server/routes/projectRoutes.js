const express = require("express");

const router = express.Router();

const {
    createProject,
    getProjects,
    getCompanyProjects,
    updateProjectStatus,
} = require("../controllers/projectController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// Create Project
router.post(
    "/",
    protect,
    authorizeRoles("super_admin", "project_manager"),
    createProject
);

// Get All Projects
router.get(
    "/",
    protect,
    authorizeRoles("super_admin", "project_manager"),
    getProjects
);

// Get Company Projects
router.get(
    "/company/:companyId",
    protect,
    authorizeRoles("super_admin", "project_manager"),
    getCompanyProjects
);

// Update Project Status
router.put(
    "/:id/status",
    protect,
    authorizeRoles("super_admin", "project_manager"),
    updateProjectStatus
);

module.exports = router;