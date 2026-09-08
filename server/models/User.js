const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: [
      "super_admin",
      "counselor",
      "hr",
      "trainer",
      "placement_coordinator",
      "project_manager",
      "employee",
      "intern"
    ],
    default: "counselor"
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastLogin: Date

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);