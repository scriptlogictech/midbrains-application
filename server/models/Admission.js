const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    contactNumber: {
      type: String,
      required: true,
    },

    email: {
      type: String,
    },

    courseName: {
      type: String,
      required: true,
    },

    batchName: {
      type: String,
      required: true,
    },

    fees: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    internshipAssigned: {
      type: Boolean,
      default: false,
    },

    placementSupport: {
      type: Boolean,
      default: true,
    },

    admissionDate: {
      type: Date,
      default: Date.now,
    },

    remarks: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admission", admissionSchema);