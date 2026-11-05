
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        // User who uploaded the document
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Company to which the user belongs
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },

        // Document category
        documentType: {
            type: String,
            enum: [
                "aadhaar",
                "pan",
                "address_proof",
                "passport_photo",
                "class_10",
                "class_12",
                "graduation",
            ],
            required: true,
        },

        // Only applicable to address_proof
        addressProofType: {
            type: String,
            enum: [
                "rent_agreement",
                "electricity_bill",
                null,
            ],
            default: null,
        },

        // Original uploaded filename
        fileName: {
            type: String,
            required: true,
            trim: true,
        },

        // Cloudinary public ID
        publicId: {
            type: String,
            required: true,
        },

        // Image format
        format: {
            type: String,
            enum: ["jpg", "jpeg"],
            required: true,
        },

        // File size in bytes
        fileSize: {
            type: Number,
            required: true,
            max: 200 * 1024,
        },

        // Admin verification status
        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
            ],
            default: "pending",
        },

        // Admin rejection or approval remark
        adminRemark: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        },

        // Admin who reviewed the document
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// One document per category per user.
// Address proof is treated as one category,
// whether it is a rent agreement or electricity bill.
documentSchema.index(
    {
        user: 1,
        documentType: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "Document",
    documentSchema
);
