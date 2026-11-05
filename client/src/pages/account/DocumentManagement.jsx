
import { useEffect, useState } from "react";
import {
    getAllDocuments,
    getDocumentAccess,
    reviewDocument,
} from "../../services/documentService";
import "./DocumentManagement.css";

const documentLabels = {
    aadhaar: "Aadhaar Card",
    pan: "PAN Card",
    address_proof: "Address Proof",
    passport_photo: "Passport Photo",
    class_10: "Class 10 Marksheet",
    class_12: "Class 12 Marksheet",
    graduation: "Graduation Marksheet",
};

const DocumentManagement = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [companyFilter, setCompanyFilter] = useState("");
    const [companies, setCompanies] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [remark, setRemark] = useState("");
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState("");

    const loadDocuments = async () => {
        try {
            setLoading(true);

            const filters = {};

            if (statusFilter !== "all") {
                filters.status = statusFilter;
            }

            if (companyFilter) {
                filters.companyId = companyFilter;
            }

            const response = await getAllDocuments(filters);
            const data = response.documents || [];

            setDocuments(data);

            const uniqueCompanies = [
                ...new Map(
                    data
                        .filter((doc) => doc.company)
                        .map((doc) => [
                            doc.company._id,
                            doc.company,
                        ])
                ).values(),
            ];

            setCompanies((previous) => {
                const merged = new Map(
                    previous.map((company) => [company._id, company])
                );

                uniqueCompanies.forEach((company) => {
                    merged.set(company._id, company);
                });

                return Array.from(merged.values());
            });
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to load documents."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [statusFilter, companyFilter]);

    const handleView = async (document) => {
        try {
            const response = await getDocumentAccess(document._id);
            window.open(response.url, "_blank", "noopener,noreferrer");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to open document."
            );
        }
    };

    const handleReview = async (status) => {
        if (!selectedDocument) return;

        if (status === "rejected" && !remark.trim()) {
            setMessage("Please provide a rejection reason.");
            return;
        }

        try {
            setProcessing(true);
            setMessage("");

            await reviewDocument(
                selectedDocument._id,
                status,
                remark
            );

            setSelectedDocument(null);
            setRemark("");
            setMessage(`Document ${status} successfully.`);
            await loadDocuments();
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to update document status."
            );
        } finally {
            setProcessing(false);
        }
    };

    const pendingCount = documents.filter(
        (doc) => doc.status === "pending"
    ).length;

    const approvedCount = documents.filter(
        (doc) => doc.status === "approved"
    ).length;

    const rejectedCount = documents.filter(
        (doc) => doc.status === "rejected"
    ).length;

    return (
        <div className="document-admin-page">
            <div className="document-admin-header">
                <div>
                    <span>ADMINISTRATION</span>
                    <h2>Document Management</h2>
                    <p>Review and manage employee and intern documents.</p>
                </div>
            </div>

            {message && (
                <div className="document-admin-message">
                    {message}
                    <button onClick={() => setMessage("")}>×</button>
                </div>
            )}

            <div className="document-admin-stats">
                <div className="document-stat-card">
                    <span>Total Documents</span>
                    <strong>{documents.length}</strong>
                </div>

                <div className="document-stat-card pending">
                    <span>Pending</span>
                    <strong>{pendingCount}</strong>
                </div>

                <div className="document-stat-card approved">
                    <span>Approved</span>
                    <strong>{approvedCount}</strong>
                </div>

                <div className="document-stat-card rejected">
                    <span>Rejected</span>
                    <strong>{rejectedCount}</strong>
                </div>
            </div>

            <div className="document-admin-filters">
                <div>
                    <label>Verification Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Documents</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div>
                    <label>Company</label>
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                    >
                        <option value="">All Companies</option>
                        {companies.map((company) => (
                            <option
                                key={company._id}
                                value={company._id}
                            >
                                {company.companyName}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    className="document-refresh-btn"
                    onClick={loadDocuments}
                >
                    <i className="bi bi-arrow-clockwise" /> Refresh
                </button>
            </div>

            <div className="document-admin-table-wrapper">
                {loading ? (
                    <div className="document-admin-empty">
                        Loading documents...
                    </div>
                ) : documents.length === 0 ? (
                    <div className="document-admin-empty">
                        No documents found.
                    </div>
                ) : (
                    <table className="document-admin-table">
                        <thead>
                            <tr>
                                <th>Employee / Intern</th>
                                <th>Company</th>
                                <th>Document</th>
                                <th>Uploaded</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc._id}>
                                    <td>
                                        <strong>
                                            {doc.user?.fullName || "Unknown"}
                                        </strong>
                                        <small>{doc.user?.email}</small>
                                        <small>{doc.user?.role}</small>
                                    </td>

                                    <td>
                                        {doc.company?.companyName || "-"}
                                    </td>

                                    <td>
                                        {documentLabels[doc.documentType]}
                                        {doc.addressProofType && (
                                            <small>
                                                {doc.addressProofType.replace(
                                                    "_",
                                                    " "
                                                )}
                                            </small>
                                        )}
                                    </td>

                                    <td>
                                        {new Date(
                                            doc.createdAt
                                        ).toLocaleDateString()}
                                    </td>

                                    <td>
                                        <span
                                            className={`document-admin-status ${doc.status}`}
                                        >
                                            {doc.status}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="document-admin-actions">
                                            <button
                                                onClick={() => handleView(doc)}
                                                title="View document"
                                            >
                                                <i className="bi bi-eye" />
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSelectedDocument(doc);
                                                    setRemark(doc.adminRemark || "");
                                                }}
                                                title="Review document"
                                            >
                                                <i className="bi bi-pencil-square" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedDocument && (
                <div
                    className="document-review-overlay"
                    onClick={() => setSelectedDocument(null)}
                >
                    <div
                        className="document-review-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="document-review-heading">
                            <div>
                                <h3>Review Document</h3>
                                <p>
                                    {documentLabels[
                                        selectedDocument.documentType
                                    ]}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedDocument(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="document-review-info">
                            <p>
                                <strong>User:</strong>{" "}
                                {selectedDocument.user?.fullName}
                            </p>
                            <p>
                                <strong>Company:</strong>{" "}
                                {selectedDocument.company?.companyName}
                            </p>
                            <p>
                                <strong>File:</strong>{" "}
                                {selectedDocument.fileName}
                            </p>
                        </div>

                        <button
                            className="document-review-view"
                            onClick={() => handleView(selectedDocument)}
                        >
                            <i className="bi bi-eye" /> View Uploaded Document
                        </button>

                        <div className="document-review-remark">
                            <label>Admin Remark</label>
                            <textarea
                                rows="4"
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                placeholder="Enter remark or rejection reason..."
                                maxLength={500}
                            />
                        </div>

                        <div className="document-review-actions">
                            <button
                                className="document-reject-btn"
                                disabled={processing}
                                onClick={() => handleReview("rejected")}
                            >
                                Reject
                            </button>

                            <button
                                className="document-approve-btn"
                                disabled={processing}
                                onClick={() => handleReview("approved")}
                            >
                                {processing ? "Processing..." : "Approve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentManagement;
