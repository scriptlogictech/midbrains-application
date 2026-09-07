const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },

  companyCode: {
    type: String,
    required: true,
    unique: true
  },

  logo: {
    type: String
  },

  description: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);