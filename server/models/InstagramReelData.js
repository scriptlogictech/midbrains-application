
const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    nextFollowUpDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Completed",
        "Not Interested",
        "No Response",
      ],
      default: "Pending",
    },

    communicationNotes: {
      type: String,
      trim: true,
      default: "",
    },

    communicationDate: {
      type: Date,
      default: Date.now,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const instagramReelDataSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    lookingFor: {
      type: String,
      enum: [
        "Job",
        "Internship",
        "Training-Internship",
      ],
      required: true,
    },

    resumeLink: {
      type: String,
      trim: true,
      default: "",
    },

    followUps: [followUpSchema],

    lastFollowUpDate: {
      type: Date,
      default: null,
    },

    nextFollowUpDate: {
      type: Date,
      default: null,
    },

    followUpStatus: {
      type: String,
      enum: [
        "Not Started",
        "Pending",
        "In Progress",
        "Completed",
        "Not Interested",
      ],
      default: "Not Started",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InstagramReelData",
  instagramReelDataSchema
);