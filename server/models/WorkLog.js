
const mongoose = require("mongoose");

const workLogSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkTask",
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Daily work time
    startTime: {
      type: String,
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String,
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    hoursWorked: {
      type: Number,
      min: 0,
      default: 0,
    },

    workDescription: {
      type: String,
      required: true,
      trim: true,
    },

    blockers: {
      type: String,
      trim: true,
    },

    nextPlan: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WorkLog", workLogSchema);