
const mongoose = require("mongoose");
const Project = require("../models/Project");
const cloudinary = require("../config/cloudinary");

// ==========================================
// GET COMPANY ID
// ==========================================
const getCompanyId = (req) => {
  if (!req.user) {
    throw new Error("Authenticated user not found in request");
  }

  // Super Admin selects a company
  if (req.user.role === "super_admin") {
    return (
      req.body?.company ||
      req.query?.companyId ||
      req.query?.company ||
      req.params?.companyId ||
      null
    );
  }

  // Employee gets their assigned company
  const company = req.user.company;

  if (!company) {
    return null;
  }

  return company._id || company;
};

// ==========================================
// VALIDATE MONGODB OBJECT ID
// ==========================================
const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==========================================
// PARSE ARRAY
// ==========================================
const parseArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [value];
  }
};

// ==========================================
// CLOUDINARY IMAGE UPLOAD
// ==========================================
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "projects",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result?.secure_url) {
          return reject(
            new Error("Cloudinary did not return an image URL")
          );
        }

        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};

// Upload multiple screenshots
const uploadProjectScreenshots = async (files = []) => {
  if (!files || !files.length) {
    return [];
  }

  return Promise.all(files.map(uploadToCloudinary));
};

// ==========================================
// CREATE PROJECT
// ==========================================
exports.createProject = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    const {
      projectName,
      projectCategory,
      projectDescription,
      projectOutcomes,
      projectUrl,
      isPublished,
    } = req.body || {};

    const company = getCompanyId(req);

    if (!company || !isValidId(company)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid company",
      });
    }

    if (
      typeof projectName !== "string" ||
      !projectName.trim() ||
      typeof projectCategory !== "string" ||
      !projectCategory.trim() ||
      typeof projectDescription !== "string" ||
      !projectDescription.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Project name, category and description are required",
      });
    }

    const uploadedScreenshots =
      await uploadProjectScreenshots(req.files);

    const project = await Project.create({
      company,
      projectName: projectName.trim(),
      projectCategory: projectCategory.trim(),
      projectDescription: projectDescription.trim(),
      projectOutcomes: parseArray(projectOutcomes),
      projectScreenshots: uploadedScreenshots,
      projectUrl:
        typeof projectUrl === "string" ? projectUrl.trim() : "",
      isPublished:
        isPublished !== "false" && isPublished !== false,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Create Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL PROJECTS
// ==========================================
exports.getProjects = async (req, res) => {
  try {
    console.log("========== GET PROJECTS DEBUG ==========");
    console.log("User exists:", !!req.user);
    console.log("User ID:", req.user?._id);
    console.log("User Role:", req.user?.role);
    console.log("User Company:", req.user?.company);
    console.log("Query Parameters:", req.query);
    console.log("========================================");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    const company = getCompanyId(req);

    console.log("Selected Company ID:", company);

    if (!company || !isValidId(company)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid company using companyId",
      });
    }

    const filter = {
      company: new mongoose.Types.ObjectId(company),
    };

    // Employees can only see published projects
    if (req.user.role !== "super_admin") {
      filter.isPublished = true;
    }

    console.log("Project Query Filter:", filter);

    const projects = await Project.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    console.log("Projects Found:", projects.length);

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Get Projects Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE PROJECT
// ==========================================
exports.getProjectById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const filter = {
      _id: id,
    };

    if (req.user.role !== "super_admin") {
      const company = getCompanyId(req);

      if (!company || !isValidId(company)) {
        return res.status(400).json({
          success: false,
          message: "Company information not found",
        });
      }

      filter.company = company;
      filter.isPublished = true;
    }

    const project = await Project.findOne(filter)
      .populate("createdBy", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get Project Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project details",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE PROJECT
// ==========================================
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const allowedFields = [
      "projectName",
      "projectCategory",
      "projectDescription",
      "projectUrl",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (
          typeof req.body[field] !== "string"
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a string`,
          });
        }

        project[field] = req.body[field].trim();
      }
    }

    if (!project.projectName) {
      return res.status(400).json({
        success: false,
        message: "Project name cannot be empty",
      });
    }

    if (!project.projectCategory) {
      return res.status(400).json({
        success: false,
        message: "Project category cannot be empty",
      });
    }

    if (!project.projectDescription) {
      return res.status(400).json({
        success: false,
        message: "Project description cannot be empty",
      });
    }

    if (req.body.projectOutcomes !== undefined) {
      project.projectOutcomes = parseArray(
        req.body.projectOutcomes
      );
    }

    if (req.body.isPublished !== undefined) {
      project.isPublished =
        req.body.isPublished !== "false" &&
        req.body.isPublished !== false;
    }

    // Preserve existing screenshots and append new uploads
    const newScreenshots =
      await uploadProjectScreenshots(req.files);

    project.projectScreenshots = [
      ...(project.projectScreenshots || []),
      ...newScreenshots,
    ];

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error("Update Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE PROJECT
// ==========================================
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: error.message,
    });
  }
};
