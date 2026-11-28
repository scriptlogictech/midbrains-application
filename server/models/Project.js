
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    projectName: {
      type: String,
      required: true,
      trim: true
    },

    projectCategory: {
      type: String,
      required: true,
      trim: true
    },

    projectDescription: {
      type: String,
      required: true,
      trim: true
    },

    projectOutcomes: [
      {
        type: String,
        trim: true
      }
    ],

    projectScreenshots: [
      {
        type: String
      }
    ],

    projectUrl: {
      type: String,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Project", projectSchema);
