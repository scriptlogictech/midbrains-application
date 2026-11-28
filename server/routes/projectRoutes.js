
const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const projectUpload = require("../middleware/projectUploadMiddleware");

// Create Project - Super Admin only
router.post(
  "/",
  protect,
  authorizeRoles("super_admin"),
  projectUpload.array("projectScreenshots", 10),
  createProject
);

// Update Project - Super Admin only
router.put(
  "/:id",
  protect,
  authorizeRoles("super_admin"),
  projectUpload.array("projectScreenshots", 10),
  updateProject
);

// View Projects - Super Admin and Employee
router.get(
  "/",
  protect,
  authorizeRoles("super_admin", "employee"),
  getProjects
);

// View Project Details
router.get(
  "/:id",
  protect,
  authorizeRoles("super_admin", "employee"),
  getProjectById
);

// Delete Project - Super Admin only
router.delete(
  "/:id",
  protect,
  authorizeRoles("super_admin"),
  deleteProject
);

module.exports = router;
