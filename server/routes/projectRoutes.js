const express = require("express");
const router = express.Router();

const {
    createProject,
    getProjects,
    getCompanyProjects,
    getProjectById,
    updateProject,
    updateProjectStatus,
    deleteProject,
} = require("../controllers/projectController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

/*
|--------------------------------------------------------------------------
| Project Management
|--------------------------------------------------------------------------
| Super Admin and Employee can manage projects.
| Interns do not have access to this module.
|--------------------------------------------------------------------------
*/

// Create Project
router.post(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    createProject
);

// Get All Projects
router.get(
    "/",
    protect,
    authorizeRoles("super_admin", "employee"),
    getProjects
);

// Get Projects By Company
// IMPORTANT: Keep this route before /:id
router.get(
    "/company/:companyId",
    protect,
    authorizeRoles("super_admin", "employee"),
    getCompanyProjects
);

// Get Project By ID
router.get(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    getProjectById
);

// Update Project Status
router.put(
    "/:id/status",
    protect,
    authorizeRoles("super_admin", "employee"),
    updateProjectStatus
);

// Update Project
router.put(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    updateProject
);

// Delete Project
router.delete(
    "/:id",
    protect,
    authorizeRoles("super_admin", "employee"),
    deleteProject
);

module.exports = router;