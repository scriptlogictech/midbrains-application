const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    clientName: {
      type: String,
      required: true,
      trim: true
    },

    clientCompany: {
      type: String,
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

    projectTitle: {
      type: String,
      required: true
    },

    projectDescription: {
      type: String
    },

    technology: {
      type: String
    },

    assignedDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    startDate: {
      type: Date,
      required: true
    },

    deadline: {
      type: Date,
      required: true
    },

    budget: {
      type: Number,
      default: 0
    },

    paidAmount: {
      type: Number,
      default: 0
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending"
    },

    projectStatus: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "testing",
        "completed",
        "delivered",
        "cancelled"
      ],
      default: "pending"
    },

    deliveryDate: {
      type: Date
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

module.exports = mongoose.model("Project", projectSchema);