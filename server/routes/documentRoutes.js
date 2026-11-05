
const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/documentUpload");

const {
    uploadDocument,
    getMyDocuments,
    getAllDocuments,
    getDocumentAccess,
    reviewDocument,
    deleteMyDocument,
} = require("../controllers/documentController");

// Employee / Intern: upload their own document
router.post(
    "/",
    protect,
    authorizeRoles("employee", "intern"),
    upload.single("document"),
    uploadDocument
);

// Employee / Intern: view their own documents
router.get(
    "/my",
    protect,
    authorizeRoles("employee", "intern"),
    getMyDocuments
);

// Super Admin: view documents across companies
router.get(
    "/admin",
    protect,
    authorizeRoles("super_admin"),
    getAllDocuments
);

// Owner or Super Admin: get a secure viewing URL
router.get(
    "/:id/access",
    protect,
    getDocumentAccess
);

// Super Admin: approve / reject
router.put(
    "/:id/review",
    protect,
    authorizeRoles("super_admin"),
    reviewDocument
);

// Employee / Intern: delete pending or rejected document
router.delete(
    "/:id",
    protect,
    authorizeRoles("employee", "intern"),
    deleteMyDocument
);

// Handle Multer validation errors
router.use((error, req, res, next) => {
    if (error instanceof require("multer").MulterError) {
        const message =
            error.code === "LIMIT_FILE_SIZE"
                ? "File size must not exceed 200 KB"
                : "Document upload error";

        return res.status(400).json({
            success: false,
            message,
        });
    }

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Invalid document upload",
        });
    }

    next();
});

module.exports = router;
