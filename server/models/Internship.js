const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: true
    },

    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    projectTitle: {
      type: String,
      required: true
    },

    technology: {
      type: String
    },

    duration: {
      type: String
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: [
        "assigned",
        "in_progress",
        "completed",
        "cancelled"
      ],
      default: "assigned"
    },

    certificateGenerated: {
      type: Boolean,
      default: false
    },

    remarks: {
      type: String
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }

  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Internship", internshipSchema);