
import api from "./api";

// ==========================================
// DOCUMENT SERVICE
// ==========================================

// Upload or replace a document
export const uploadDocument = async (formData, onUploadProgress) => {
    const response = await api.post(
        "/documents",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress,
        }
    );

    return response.data;
};

// Get logged-in user's documents
export const getMyDocuments = async () => {
    const response = await api.get("/documents/my");
    return response.data;
};

// Get all documents (Super Admin)
export const getAllDocuments = async (filters = {}) => {
    const response = await api.get("/documents/admin", {
        params: filters,
    });

    return response.data;
};

// Get secure document viewing URL
export const getDocumentAccess = async (documentId) => {
    const response = await api.get(
        `/documents/${documentId}/access`
    );

    return response.data;
};

// Approve or reject document
export const reviewDocument = async (
    documentId,
    status,
    adminRemark = ""
) => {
    const response = await api.put(
        `/documents/${documentId}/review`,
        {
            status,
            adminRemark,
        }
    );

    return response.data;
};

// Delete pending or rejected document
export const deleteDocument = async (documentId) => {
    const response = await api.delete(
        `/documents/${documentId}`
    );

    return response.data;
};



// Super Admin: Delete any user's document
export const adminDeleteDocument = async (documentId) => {
    const response = await api.delete(
        `/documents/admin/${documentId}`
    );

    return response.data;
};