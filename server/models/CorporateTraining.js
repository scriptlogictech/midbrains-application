const mongoose = require("mongoose");

const corporateTrainingSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    clientCompanyName: {
      type: String,
      required: true,
      trim: true
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true
    },

    contactNumber: {
      type: String,
      required: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    trainingTopic: {
      type: String,
      required: true
    },

    technology: {
      type: String
    },

    employeeCount: {
      type: Number,
      required: true
    },

    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    paymentAmount: {
      type: Number,
      default: 0
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending"
    },

    trainingStatus: {
      type: String,
      enum: [
        "scheduled",
        "ongoing",
        "completed",
        "cancelled"
      ],
      default: "scheduled"
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

module.exports = mongoose.model("CorporateTraining", corporateTrainingSchema);