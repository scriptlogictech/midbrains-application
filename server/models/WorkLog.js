
import mongoose from "mongoose";

const workLogSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    totalDuration: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const WorkLog = mongoose.model("WorkLog", workLogSchema);

export default WorkLog;