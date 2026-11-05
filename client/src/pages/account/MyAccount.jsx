
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
    uploadDocument,
    getMyDocuments,
    getDocumentAccess,
    deleteDocument,
} from "../../services/documentService";
import "./MyAccount.css";

const documentTypes = [
    { value: "aadhaar", label: "Aadhaar Card" },
    { value: "pan", label: "PAN Card" },
    { value: "address_proof", label: "Address Proof" },
    { value: "passport_photo", label: "Passport-size Photo" },
    { value: "class_10", label: "Class 10 Marksheet" },
    { value: "class_12", label: "Class 12 Marksheet" },
    { value: "graduation", label: "Graduation Marksheet" },
];

const MyAccount = () => {
    const { user } = useAuth();

    const [profile, setProfile] = useState({
        fullName: user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: user?.address || "",
        dateOfBirth: user?.dateOfBirth
            ? String(user.dateOfBirth).slice(0, 10)
            : "",
    });

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState("");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [addressProofType, setAddressProofType] = useState("rent_agreement");

    const isSuperAdmin = user?.role === "super_admin";

    const companyName =
        typeof user?.company === "object"
            ? user.company?.companyName
            : "Assigned Company";

    const loadDocuments = async () => {
        if (isSuperAdmin) {
            setLoading(false);
            return;
        }

        try {
            const response = await getMyDocuments();
            setDocuments(response.documents || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load documents."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [user?._id]);

    const handleProfileChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value,
        });
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            // Profile API will be connected in the backend profile stage.
            const response = await api.put(
                "/account/profile",
                {
                    fullName: profile.fullName,
                    phone: profile.phone,
                    address: profile.address,
                    dateOfBirth: profile.dateOfBirth || null,
                }
            );

            if (response.data.user) {
                setProfile((prev) => ({
                    ...prev,
                    ...response.data.user,
                }));
            }

            setSuccess("Profile updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (e, documentType) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setError("");
        setSuccess("");

        const validExtension = /\.(jpg|jpeg)$/i.test(file.name);

        if (file.type !== "image/jpeg" || !validExtension) {
            setError("Only JPG and JPEG images are allowed.");
            e.target.value = "";
            return;
        }

        if (file.size > 200 * 1024) {
            setError("File size must not exceed 200 KB.");
            e.target.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("document", file);
        formData.append("documentType", documentType);

        if (documentType === "address_proof") {
            formData.append("addressProofType", addressProofType);
        }

        try {
            setUploading(documentType);
            setProgress(0);

            const response = await uploadDocument(
                formData,
                (event) => {
                    if (event.total) {
                        setProgress(
                            Math.round(
                                (event.loaded * 100) / event.total
                            )
                        );
                    }
                }
            );

            setSuccess(response.message);
            await loadDocuments();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Document upload failed."
            );
        } finally {
            setUploading("");
            setProgress(0);
            e.target.value = "";
        }
    };

    const handleViewDocument = async (id) => {
        try {
            const response = await getDocumentAccess(id);
            window.open(response.url, "_blank", "noopener,noreferrer");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to open document."
            );
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document?")) {
            return;
        }

        try {
            await deleteDocument(id);
            setSuccess("Document deleted successfully.");
            await loadDocuments();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete document."
            );
        }
    };

    const getDocument = (type) =>
        documents.find((doc) => doc.documentType === type);

    const getStatusClass = (status) => {
        if (status === "approved") return "status-approved";
        if (status === "rejected") return "status-rejected";
        return "status-pending";
    };

    if (loading) {
        return <div className="account-loading">Loading account...</div>;
    }

    return (
        <div className="account-page">
            <div className="account-page-header">
                <div>
                    <span className="account-eyebrow">ACCOUNT SETTINGS</span>
                    <h2>My Account</h2>
                    <p>Manage your personal information and documents.</p>
                </div>
            </div>

            {error && (
                <div className="account-alert account-alert-error">
                    {error}
                    <button onClick={() => setError("")}>×</button>
                </div>
            )}

            {success && (
                <div className="account-alert account-alert-success">
                    {success}
                    <button onClick={() => setSuccess("")}>×</button>
                </div>
            )}

            <div className="account-profile-card">
                <div className="account-profile-heading">
                    <div className="account-avatar">
                        {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div>
                        <h3>{profile.fullName || "User"}</h3>
                        <p>
                            {user?.role === "super_admin"
                                ? "Super Admin"
                                : user?.role === "employee"
                                ? "Employee"
                                : "Intern"}
                        </p>
                    </div>

                    <span className="account-active-badge">
                        {user?.isActive ? "Active" : "Inactive"}
                    </span>
                </div>

                <form onSubmit={handleProfileSave}>
                    <div className="account-section-title">
                        <h3>Personal Information</h3>
                        <p>Update your personal contact information.</p>
                    </div>

                    <div className="account-form-grid">
                        <div className="account-field">
                            <label>Full Name</label>
                            <input
                                name="fullName"
                                value={profile.fullName}
                                onChange={handleProfileChange}
                                required
                            />
                        </div>

                        <div className="account-field">
                            <label>Email Address</label>
                            <input
                                value={profile.email}
                                disabled
                            />
                            <small>Contact admin to change your email.</small>
                        </div>

                        <div className="account-field">
                            <label>Phone Number</label>
                            <input
                                name="phone"
                                value={profile.phone}
                                onChange={handleProfileChange}
                                placeholder="Enter phone number"
                                maxLength={15}
                            />
                        </div>

                        <div className="account-field">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={profile.dateOfBirth}
                                onChange={handleProfileChange}
                            />
                        </div>

                        <div className="account-field account-field-full">
                            <label>Address</label>
                            <textarea
                                name="address"
                                rows="3"
                                value={profile.address}
                                onChange={handleProfileChange}
                                placeholder="Enter your address"
                            />
                        </div>

                        <div className="account-field">
                            <label>Role</label>
                            <input
                                value={
                                    user?.role?.replace("_", " ").toUpperCase() || ""
                                }
                                disabled
                            />
                        </div>

                        <div className="account-field">
                            <label>Company</label>
                            <input
                                value={companyName || "Not assigned"}
                                disabled
                            />
                        </div>
                    </div>

                    <div className="account-form-actions">
                        <button
                            type="submit"
                            className="account-primary-btn"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {!isSuperAdmin && (
                <div className="account-documents-section">
                    <div className="account-section-title">
                        <div>
                            <span className="account-eyebrow">
                                DOCUMENT VERIFICATION
                            </span>
                            <h3>My Documents</h3>
                            <p>
                                Upload clear JPG/JPEG images. Maximum size: 200 KB.
                            </p>
                        </div>

                        <span className="document-count">
                            {documents.length}/7 Uploaded
                        </span>
                    </div>

                    <div className="account-document-grid">
                        {documentTypes.map((item) => {
                            const doc = getDocument(item.value);
                            const isUploading = uploading === item.value;
                            const canReplace =
                                !doc ||
                                doc.status === "pending" ||
                                doc.status === "rejected";

                            return (
                                <div
                                    className="account-document-card"
                                    key={item.value}
                                >
                                    <div className="document-card-top">
                                        <div className="document-icon">
                                            <i className="bi bi-file-earmark-image" />
                                        </div>

                                        <span
                                            className={`document-status ${
                                                doc
                                                    ? getStatusClass(doc.status)
                                                    : "status-missing"
                                            }`}
                                        >
                                            {doc
                                                ? doc.status
                                                : "Not Uploaded"}
                                        </span>
                                    </div>

                                    <h4>{item.label}</h4>

                                    {item.value === "address_proof" && (
                                        <div className="account-field">
                                            <label>Proof Type</label>
                                            <select
                                                value={addressProofType}
                                                onChange={(e) =>
                                                    setAddressProofType(e.target.value)
                                                }
                                            >
                                                <option value="rent_agreement">
                                                    Rent Agreement
                                                </option>
                                                <option value="electricity_bill">
                                                    Electricity Bill
                                                </option>
                                            </select>
                                        </div>
                                    )}

                                    {doc && (
                                        <>
                                            <p className="document-filename">
                                                {doc.fileName}
                                            </p>

                                            {doc.adminRemark && (
                                                <p className="document-remark">
                                                    Admin: {doc.adminRemark}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                className="document-view-btn"
                                                onClick={() =>
                                                    handleViewDocument(doc._id)
                                                }
                                            >
                                                <i className="bi bi-eye" /> View
                                            </button>

                                            {doc.status !== "approved" && (
                                                <button
                                                    type="button"
                                                    className="document-delete-btn"
                                                    onClick={() =>
                                                        handleDelete(doc._id)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {isUploading && (
                                        <div className="document-progress">
                                            <div>
                                                <span>Uploading...</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="document-progress-track">
                                                <div
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {canReplace && !isUploading && (
                                        <label className="document-upload-btn">
                                            <i className="bi bi-cloud-arrow-up" />
                                            {doc ? "Replace Document" : "Upload Document"}

                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,image/jpeg"
                                                hidden
                                                onChange={(e) =>
                                                    handleUpload(e, item.value)
                                                }
                                            />
                                        </label>
                                    )}

                                    {doc?.status === "approved" && (
                                        <p className="document-locked-note">
                                            <i className="bi bi-shield-check" />
                                            Approved document
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {isSuperAdmin && (
                <div className="account-admin-note">
                    <i className="bi bi-shield-check" />
                    <div>
                        <strong>Administrator Account</strong>
                        <p>
                            Use Document Management to review employee and
                            intern documents across companies.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAccount;
