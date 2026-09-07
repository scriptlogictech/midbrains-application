const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema(
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

    hiringCompany: {
      type: String,
      required: true
    },

    jobRole: {
      type: String,
      required: true
    },

    package: {
      type: Number,
      required: true
    },

    interviewDate: {
      type: Date,
      required: true
    },

    hrName: {
      type: String
    },

    hrContact: {
      type: String
    },

    interviewStatus: {
      type: String,
      enum: [
        "scheduled",
        "selected",
        "rejected",
        "pending"
      ],
      default: "scheduled"
    },

    joiningDate: {
      type: Date
    },

    joiningStatus: {
      type: String,
      enum: [
        "not_joined",
        "joined"
      ],
      default: "not_joined"
    },

    offerLetter: {
      type: String
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

module.exports = mongoose.model("Placement", placementSchema);