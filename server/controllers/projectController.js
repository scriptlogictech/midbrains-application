
const mongoose = require("mongoose");
const Project = require("../models/Project");
const cloudinary = require("../config/cloudinary");

// Get company ID based on logged-in user
const getCompanyId = (req) => {
  if (req.user.role === "super_admin") {
    return req.body.company || req.query.companyId || req.params.companyId;
  }

  return req.user.company?._id || req.user.company;
};

// Validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Parse arrays sent through multipart/form-data
const parseArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [value];
  }
};

// Upload one image buffer to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "projects",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};

// Upload all selected project screenshots
const uploadProjectScreenshots = async (files = []) => {
  return Promise.all(files.map(uploadToCloudinary));
};


// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const {
      projectName,
      projectCategory,
      projectDescription,
      projectOutcomes,
      projectUrl,
      isPublished,
    } = req.body;

    const company = getCompanyId(req);

    if (!company || !isValidId(company)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid company",
      });
    }

    if (!projectName?.trim() ||
        !projectCategory?.trim() ||
        !projectDescription?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name, category and description are required",
      });
    }

    const uploadedScreenshots = await uploadProjectScreenshots(req.files);

    const project = await Project.create({
      company,
      projectName: projectName.trim(),
      projectCategory: projectCategory.trim(),
      projectDescription: projectDescription.trim(),
      projectOutcomes: parseArray(projectOutcomes),
      projectScreenshots: uploadedScreenshots,
      projectUrl: projectUrl?.trim() || "",
      isPublished: isPublished !== "false" && isPublished !== false,
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


// GET ALL PROJECTS
exports.getProjects = async (req, res) => {
  try {
    const company = getCompanyId(req);

    if (!company || !isValidId(company)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid company using companyId",
      });
    }

    const filter = { company };

    if (req.user.role !== "super_admin") {
      filter.isPublished = true;
    }

    const projects = await Project.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

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


// GET SINGLE PROJECT
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const filter = { _id: id };

    if (req.user.role !== "super_admin") {
      const company = getCompanyId(req);

      if (!company) {
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


// UPDATE PROJECT
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

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    if (req.body.projectName !== undefined &&
        !req.body.projectName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name cannot be empty",
      });
    }

    if (req.body.projectCategory !== undefined &&
        !req.body.projectCategory.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project category cannot be empty",
      });
    }

    if (req.body.projectDescription !== undefined &&
        !req.body.projectDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project description cannot be empty",
      });
    }

    if (req.body.projectOutcomes !== undefined) {
      project.projectOutcomes = parseArray(req.body.projectOutcomes);
    }

    if (req.body.isPublished !== undefined) {
      project.isPublished =
        req.body.isPublished !== "false" &&
        req.body.isPublished !== false;
    }

    // Keep existing screenshots and append newly uploaded ones
    const newScreenshots = await uploadProjectScreenshots(req.files);

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


// DELETE PROJECT
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
