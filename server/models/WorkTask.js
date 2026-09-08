const mongoose = require("mongoose");

const workTaskSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    deadline: {
      type: Date,
      required: true,
    },

    estimatedHours: {
      type: Number,
      min: 0,
      default: 0,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkTask", workTaskSchema);