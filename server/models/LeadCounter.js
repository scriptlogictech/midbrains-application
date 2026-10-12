
const mongoose = require("mongoose");

const leadCounterSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
    },
    lastNumber: {
        type: Number,
        default: 0,
    },
});

leadCounterSchema.index({ company: 1 }, { unique: true });

module.exports = mongoose.model("LeadCounter", leadCounterSchema);
