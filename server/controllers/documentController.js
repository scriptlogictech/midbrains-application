
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const Document = require("../models/Document");
const cloudinary = require("../config/cloudinary");

const MAX_FILE_SIZE = 200 * 1024;

const allowedDocumentTypes = [
    "aadhaar",
    "pan",
    "address_proof",
    "passport_photo",
    "class_10",
    "class_12",
    "graduation",
];

const uploadToCloudinary = (buffer, publicId) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                public_id: publicId,
                folder: "crm-private-documents",
                resource_type: "image",
                type: "authenticated",
                format: "jpg",
                overwrite: false,
                unique_filename: false,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
};

const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            type: "authenticated",
        });
    } catch (error) {
        console.error("Cloudinary delete error:", error.message);
    }
};

const isValidJpeg = (buffer) => {
    return (
        Buffer.isBuffer(buffer) &&
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    );
};

const getDocumentResponse = (doc) => ({
    _id: doc._id,
    user: doc.user,
    company: doc.company,
    documentType: doc.documentType,
    addressProofType: doc.addressProofType,
    fileName: doc.fileName,
    format: doc.format,
    fileSize: doc.fileSize,
    status: doc.status,
    adminRemark: doc.adminRemark,
    reviewedBy: doc.reviewedBy,
    reviewedAt: doc.reviewedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});

// =====================================================
// UPLOAD / REPLACE OWN DOCUMENT
// POST /api/documents
// =====================================================

exports.uploadDocument = async (req, res) => {
    let uploadedPublicId = null;

    try {
        const { documentType, addressProofType } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a document",
            });
        }

        if (!allowedDocumentTypes.includes(documentType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document category",
            });
        }

        if (
            req.file.mimetype !== "image/jpeg" ||
            !isValidJpeg(req.file.buffer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Only valid JPG/JPEG images are allowed",
            });
        }

        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(400).json({
                success: false,
                message: "Maximum file size is 200 KB",
            });
        }

        if (
            documentType === "address_proof" &&
            !["rent_agreement", "electricity_bill"].includes(
                addressProofType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Select Rent Agreement or Electricity Bill",
            });
        }

        if (
            documentType !== "address_proof" &&
            addressProofType
        ) {
            return res.status(400).json({
                success: false,
                message: "Address proof type is only valid for address proof",
            });
        }

        if (!req.user.company?._id) {
            return res.status(400).json({
                success: false,
                message: "Your account is not assigned to a company",
            });
        }

        const existingDocument = await Document.findOne({
            user: req.user._id,
            documentType,
        });

        // Keep the existing file until the replacement upload succeeds.
        const publicId =
            `crm-private-documents/${req.user._id}/${randomUUID()}`;

        const cloudinaryResult = await uploadToCloudinary(
            req.file.buffer,
            publicId
        );

        uploadedPublicId = cloudinaryResult.public_id;

        const documentData = {
            user: req.user._id,
            company: req.user.company._id,
            documentType,
            addressProofType:
                documentType === "address_proof"
                    ? addressProofType
                    : null,
            fileName: req.file.originalname,
            publicId: cloudinaryResult.public_id,
            format: cloudinaryResult.format,
            fileSize: req.file.size,
            status: "pending",
            adminRemark: "",
            reviewedBy: null,
            reviewedAt: null,
        };

        let savedDocument;

        if (existingDocument) {
            const oldPublicId = existingDocument.publicId;

            Object.assign(existingDocument, documentData);
            savedDocument = await existingDocument.save();

            // Delete old file only after successful database update.
            await deleteFromCloudinary(oldPublicId);
        } else {
            savedDocument = await Document.create(documentData);
        }

        return res.status(201).json({
            success: true,
            message: "Document uploaded successfully. Waiting for admin review.",
            document: getDocumentResponse(savedDocument),
        });
    } catch (error) {
        // Clean up a newly uploaded file if saving fails.
        if (uploadedPublicId) {
            await deleteFromCloudinary(uploadedPublicId);
        }

        console.error("Upload Document Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This document category already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Document upload failed",
        });
    }
};

// =====================================================
// GET MY DOCUMENTS
// GET /api/documents/my
// =====================================================

exports.getMyDocuments = async (req, res) => {
    try {
        const documents = await Document.find({
            user: req.user._id,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            documents: documents.map(getDocumentResponse),
        });
    } catch (error) {
        console.error("Get My Documents Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your documents",
        });
    }
};

// =====================================================
// ADMIN: GET ALL DOCUMENTS
// GET /api/documents/admin
// Optional query: ?companyId=...
// =====================================================

exports.getAllDocuments = async (req, res) => {
    try {
        const filter = {};

        if (req.query.companyId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.companyId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid company ID",
                });
            }

            filter.company = req.query.companyId;
        }

        if (req.query.status) {
            if (!["pending", "approved", "rejected"].includes(req.query.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid document status",
                });
            }

            filter.status = req.query.status;
        }

        if (req.query.documentType) {
            if (!allowedDocumentTypes.includes(req.query.documentType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid document category",
                });
            }

            filter.documentType = req.query.documentType;
        }

        const documents = await Document.find(filter)
            .populate("user", "fullName email role")
            .populate("company", "companyName companyCode")
            .populate("reviewedBy", "fullName email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: documents.length,
            documents: documents.map(getDocumentResponse),
        });
    } catch (error) {
        console.error("Get All Documents Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch documents",
        });
    }
};

// =====================================================
// GET SECURE DOCUMENT URL
// GET /api/documents/:id/access
// Owner OR Super Admin only
// =====================================================

exports.getDocumentAccess = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID",
            });
        }

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        const isOwner =
            document.user.toString() === req.user._id.toString();

        const isAdmin = req.user.role === "super_admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this document",
            });
        }

        const signedUrl = cloudinary.url(document.publicId, {
            resource_type: "image",
            type: "authenticated",
            sign_url: true,
            secure: true,
            format: document.format,
        });

        return res.status(200).json({
            success: true,
            url: signedUrl,
            expiresIn: "Cloudinary authenticated delivery URL",
        });
    } catch (error) {
        console.error("Document Access Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to access document",
        });
    }
};

// =====================================================
// ADMIN: APPROVE OR REJECT DOCUMENT
// PUT /api/documents/:id/review
// =====================================================

exports.reviewDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminRemark = "" } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID",
            });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be approved or rejected",
            });
        }

        if (
            typeof adminRemark !== "string" ||
            adminRemark.length > 500
        ) {
            return res.status(400).json({
                success: false,
                message: "Remark must be a string of at most 500 characters",
            });
        }

        if (status === "rejected" && !adminRemark.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a reason for rejection",
            });
        }

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        document.status = status;
        document.adminRemark = adminRemark.trim();
        document.reviewedBy = req.user._id;
        document.reviewedAt = new Date();

        await document.save();

        return res.status(200).json({
            success: true,
            message: `Document ${status} successfully`,
            document: getDocumentResponse(document),
        });
    } catch (error) {
        console.error("Review Document Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to review document",
        });
    }
};

// =====================================================
// DELETE OWN DOCUMENT
// DELETE /api/documents/:id
// Only pending/rejected documents can be deleted.
// =====================================================

exports.deleteMyDocument = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID",
            });
        }

        const document = await Document.findOne({
            _id: id,
            user: req.user._id,
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        if (document.status === "approved") {
            return res.status(403).json({
                success: false,
                message: "Approved documents cannot be deleted. Contact admin.",
            });
        }

        await deleteFromCloudinary(document.publicId);
        await document.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Document deleted successfully",
        });
    } catch (error) {
        console.error("Delete Document Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete document",
        });
    }
};
