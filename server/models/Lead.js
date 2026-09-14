const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
    {
        // ==========================================
        // Multi-company support
        // ==========================================

        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },

        // ==========================================
        // Basic Details
        // ==========================================

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        contactNumber: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            lowercase: true,
            trim: true,
        },

        city: {
            type: String,
            trim: true,
        },

        // ==========================================
        // Lead Date
        // ==========================================
        // The actual date on which the lead was received.

        leadDate: {
            type: Date,
            default: Date.now,
        },

        // ==========================================
        // Course / Inquiry
        // ==========================================

        courseInterested: {
            type: String,
        },

        inquiryType: {
            type: String,
            enum: [
                "course",
                "internship",
                "corporate_training",
                "project",
                "placement",
            ],
            default: "course",
        },

        // ==========================================
        // Lead Source
        // ==========================================

        leadSource: {
            type: String,
            enum: [
                "instagram",
                "whatsapp",
                "walkin",
                "website",
                "facebook",
                "linkedin",
                "phone_call",
                "reference",
                "internship",
                "corporate_training",
                "project_client",
            ],
        },

        // ==========================================
        // Assigned Employee / Intern
        // ==========================================
        // Keeping the existing field name
        // "assignedCounselor" to avoid breaking
        // the existing frontend/database structure.
        //
        // It can reference either:
        // - Employee
        // - Intern

        assignedCounselor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // ==========================================
        // Priority
        // ==========================================

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        // ==========================================
        // Status
        // ==========================================

        status: {
            type: String,
            enum: [
                "new",
                "contacted",
                "interested",
                "follow_up",
                "converted",
                "not_interested",
                "closed",
            ],
            default: "new",
        },

        // ==========================================
        // Follow-up
        // ==========================================

        nextFollowUpDate: {
            type: Date,
        },

        // ==========================================
        // Notes
        // ==========================================

        notes: {
            type: String,
        },

        // ==========================================
        // Communication History
        // ==========================================

        communicationHistory: [
            {
                type: {
                    type: String,
                    enum: [
                        "call",
                        "whatsapp",
                        "email",
                        "meeting",
                    ],
                },

                message: String,

                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // ==========================================
        // Fees
        // ==========================================

        expectedFees: {
            type: Number,
        },

        // ==========================================
        // Admission Date
        // ==========================================

        admissionDate: {
            type: Date,
        },

        // ==========================================
        // Created By
        // ==========================================

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Lead", leadSchema);