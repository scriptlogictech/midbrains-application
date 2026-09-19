
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";
import "./InstagramReelData.css";

const emptyForm = {
    company: "",
    name: "",
    contactNumber: "",
    email: "",
    lookingFor: "Job",
    resumeLink: "",
};

const emptyFollowUp = {
    assignedEmployee: "",
    nextFollowUpDate: "",
    status: "Pending",
    communicationNotes: "",
};

const InstagramReelData = () => {
    const fileInputRef = useRef(null);

    const [records, setRecords] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [uploadCompany, setUploadCompany] = useState("");
    const [showUploadCompanyModal, setShowUploadCompanyModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const [showForm, setShowForm] = useState(false);
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [followUpForm, setFollowUpForm] =
        useState(emptyFollowUp);

    // Fetch records
    const fetchRecords = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/instagram-reel-data"
            );

            setRecords(response.data?.data || []);
        } catch (error) {
            console.error("Fetch records error:", error);
            alert(
                error.response?.data?.message ||
                "Failed to fetch records"
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            const response = await api.get(
                "/instagram-reel-data/employees"
            );

            setEmployees(response.data?.data || []);
        } catch (error) {
            console.error("Fetch employees error:", error);
        }
    };

    // Fetch companies for Super Admin Excel upload
    const fetchCompanies = async () => {
        try {
            const response = await api.get("/companies");
            const companyList = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];
            setCompanies(companyList);
        } catch (error) {
            console.error("Fetch companies error:", error);
        }
    };

    useEffect(() => {
        fetchRecords();
        fetchEmployees();
        fetchCompanies();
    }, []);

    // Input change
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Follow-up input change
    const handleFollowUpChange = (event) => {
        const { name, value } = event.target;

        setFollowUpForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Open add form
    const openAddForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(true);
    };

    // Open edit form
    const openEditForm = (record) => {
        setForm({
            name: record.name || "",
            contactNumber: record.contactNumber || "",
            email: record.email || "",
            lookingFor: record.lookingFor || "Job",
            resumeLink: record.resumeLink || "",
            company: record.company?._id || record.company || "",
        });

        setEditingId(record._id);
        setShowForm(true);
    };

    // Save record
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.name.trim() || !form.contactNumber.trim()) {
            alert("Name and contact number are required");
            return;
        }

        if (!editingId && !form.company) {
            alert("Please select a company");
            return;
        }

        try {
            setSaving(true);

            if (editingId) {
                await api.put(
                    `/instagram-reel-data/${editingId}`,
                    form
                );

                alert("Record updated successfully");
            } else {
                await api.post(
                    "/instagram-reel-data",
                    form
                );

                alert("Record added successfully");
            }

            setShowForm(false);
            setForm(emptyForm);
            setEditingId(null);

            await fetchRecords();
        } catch (error) {
            console.error("Save record error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to save record"
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete record
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this record?"
        );

        if (!confirmed) return;

        try {
            await api.delete(
                `/instagram-reel-data/${id}`
            );

            setRecords((previous) =>
                previous.filter((record) => record._id !== id)
            );

            alert("Record deleted successfully");
        } catch (error) {
            console.error("Delete record error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to delete record"
            );
        }
    };

    // Open follow-up popup
    const openFollowUp = (record) => {
        setSelectedRecord(record);
        setFollowUpForm(emptyFollowUp);
        setShowFollowUp(true);
    };

    // Add follow-up
    const handleFollowUpSubmit = async (event) => {
        event.preventDefault();

        if (
            !followUpForm.assignedEmployee ||
            !followUpForm.nextFollowUpDate
        ) {
            alert(
                "Employee and next follow-up date are required"
            );

            return;
        }

        try {
            setSaving(true);

            await api.post(
                `/instagram-reel-data/${selectedRecord._id}/follow-up`,
                followUpForm
            );

            alert("Follow-up added successfully");

            setShowFollowUp(false);
            setFollowUpForm(emptyFollowUp);
            setSelectedRecord(null);

            await fetchRecords();
        } catch (error) {
            console.error("Add follow-up error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to add follow-up"
            );
        } finally {
            setSaving(false);
        }
    };

    // Show communication history
    const openHistory = (record) => {
        setSelectedRecord(record);
        setShowHistory(true);
    };

    // Normalize Excel headers
    const normalizeHeader = (value) => {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    };

    // Get Excel value
    const getSheetValue = (row, possibleHeaders) => {
        const rowKeys = Object.keys(row);

        const matchingKey = rowKeys.find((key) =>
            possibleHeaders.includes(normalizeHeader(key))
        );

        return matchingKey ? row[matchingKey] : "";
    };

    // Open company selection before Excel upload
    const openUploadCompanyModal = () => {
        if (!companies.length) {
            alert("Companies are still loading. Please try again.");
            fetchCompanies();
            return;
        }

        setUploadCompany(companies[0]?._id || "");
        setShowUploadCompanyModal(true);
    };

    // Upload Excel or CSV
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!uploadCompany) {
            alert("Please select a company before uploading.");
            return;
        }

        try {
            setSaving(true);

            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (!rows.length) {
                alert("The uploaded file is empty");
                return;
            }

            let successCount = 0;
            let skippedCount = 0;
            let failedCount = 0;
            const errors = [];

            for (const [index, row] of rows.entries()) {
                const record = {
                    company: uploadCompany,
                    name: String(getSheetValue(row, [
                        "name",
                        "fullname",
                        "studentname",
                        "candidatename",
                        "candidate",
                    ]) || "").trim(),
                    contactNumber: String(getSheetValue(row, [
                        "contactnumber",
                        "contactno",
                        "mobilenumber",
                        "mobileno",
                        "phonenumber",
                        "phoneno",
                        "whatsappnumber",
                        "phone",
                        "mobile",
                        "contact",
                    ]) || "").trim(),
                    email: String(getSheetValue(row, [
                        "email",
                        "emailid",
                        "mail",
                    ]) || "").trim(),
                    lookingFor: String(getSheetValue(row, [
                        "lookingfor",
                        "lookingfor",
                        "requirement",
                        "interestedin",
                    ]) || "Job").trim(),
                    resumeLink: String(getSheetValue(row, [
                        "resumelink",
                        "resume",
                        "cv",
                    ]) || "").trim(),
                };

                if (!record.name || !record.contactNumber) {
                    skippedCount++;
                    continue;
                }

                try {
                    await api.post("/instagram-reel-data", record);
                    successCount++;
                } catch (error) {
                    failedCount++;
                    const message =
                        error.response?.data?.message ||
                        error.response?.data?.error ||
                        error.message ||
                        "Unknown error";

                    errors.push(`Row ${index + 2}: ${message}`);
                    console.error(`Failed to upload row ${index + 2}:`, error.response?.data || error);
                }
            }

            const errorPreview = errors.slice(0, 5).join("\n");
            alert(
                `Upload completed\n\nSuccessful: ${successCount}\nFailed: ${failedCount}\nSkipped: ${skippedCount}` +
                (errorPreview ? `\n\nErrors:\n${errorPreview}` : "")
            );

            await fetchRecords();
        } catch (error) {
            console.error("File upload error:", error);
            alert(
                error.response?.data?.message ||
                "Failed to read uploaded file"
            );
        } finally {
            setSaving(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Filter records
    const filteredRecords = records.filter((record) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            record.name?.toLowerCase().includes(searchText) ||
            record.contactNumber
                ?.toLowerCase()
                .includes(searchText) ||
            record.email?.toLowerCase().includes(searchText);

        const matchesFilter =
            filter === "All" ||
            record.followUpStatus === filter;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="instagram-reel-page">
            <div className="instagram-reel-header">
                <div>
                    <h2>Instagram Reel Data</h2>

                    <p>
                        Manage Instagram candidates and follow-ups
                    </p>
                </div>

                <div className="instagram-reel-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={openUploadCompanyModal}
                        disabled={saving}
                    >
                        <i className="bi bi-upload"></i>
                        Upload Sheet
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        hidden
                    />

                    <button
                        className="btn btn-primary"
                        onClick={openAddForm}
                    >
                        <i className="bi bi-plus-lg"></i>
                        Add Record
                    </button>
                </div>
            </div>

            <div className="instagram-reel-toolbar">
                <input
                    type="text"
                    placeholder="Search by name, phone or email..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />

                <select
                    value={filter}
                    onChange={(event) =>
                        setFilter(event.target.value)
                    }
                >
                    <option value="All">All Status</option>
                    <option value="Not Started">
                        Not Started
                    </option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">
                        In Progress
                    </option>
                    <option value="Completed">Completed</option>
                    <option value="Not Interested">
                        Not Interested
                    </option>
                </select>
            </div>

            <div className="instagram-reel-table-wrapper">
                {loading ? (
                    <div className="empty-state">
                        Loading records...
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="empty-state">
                        No records found
                    </div>
                ) : (
                    <table className="instagram-reel-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Email</th>
                                <th>Looking For</th>
                                <th>Status</th>
                                <th>Next Follow-up</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRecords.map(
                                (record, index) => (
                                    <tr key={record._id}>
                                        <td>{index + 1}</td>

                                        <td>
                                            <strong>
                                                {record.name}
                                            </strong>
                                        </td>

                                        <td>
                                            {record.contactNumber}
                                        </td>

                                        <td>
                                            {record.email || "-"}
                                        </td>

                                        <td>
                                            {record.lookingFor}
                                        </td>

                                        <td>
                                            <span className="status-badge">
                                                {record.followUpStatus ||
                                                    "Not Started"}
                                            </span>
                                        </td>

                                        <td>
                                            {record.nextFollowUpDate
                                                ? new Date(
                                                    record.nextFollowUpDate
                                                ).toLocaleDateString()
                                                : "-"}
                                        </td>

                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() =>
                                                        openFollowUp(
                                                            record
                                                        )
                                                    }
                                                >
                                                    Take Follow-up
                                                </button>

                                                <button
                                                    className="btn btn-info btn-sm"
                                                    onClick={() =>
                                                        openHistory(
                                                            record
                                                        )
                                                    }
                                                >
                                                    History
                                                </button>

                                                <button
                                                    className="btn btn-warning btn-sm"
                                                    onClick={() =>
                                                        openEditForm(
                                                            record
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() =>
                                                        handleDelete(
                                                            record._id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Excel upload company modal */}
            {showUploadCompanyModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Select Company for Upload</h3>
                            <button
                                type="button"
                                onClick={() => setShowUploadCompanyModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Select Company *</label>
                            <select
                                value={uploadCompany}
                                onChange={(event) => setUploadCompany(event.target.value)}
                                required
                            >
                                <option value="">Select Company</option>
                                {companies.map((company) => (
                                    <option key={company._id} value={company._id}>
                                        {company.name || company.companyName || company.code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p>All rows from the selected Excel file will be saved under this company.</p>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowUploadCompanyModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={!uploadCompany || saving}
                                onClick={() => {
                                    setShowUploadCompanyModal(false);
                                    setTimeout(() => fileInputRef.current?.click(), 0);
                                }}
                            >
                                Continue to File
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>
                                {editingId
                                    ? "Edit Record"
                                    : "Add Record"}
                            </h3>

                            <button
                                onClick={() => setShowForm(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>

                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Contact Number *</label>

                                <input
                                    name="contactNumber"
                                    value={form.contactNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Company *</label>

                                <select
                                    name="company"
                                    value={form.company}
                                    onChange={handleChange}
                                    required={!editingId}
                                    disabled={Boolean(editingId)}
                                >
                                    <option value="">Select Company</option>
                                    {companies.map((company) => (
                                        <option key={company._id} value={company._id}>
                                            {company.name || company.companyName || company.code}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Looking For</label>

                                <select
                                    name="lookingFor"
                                    value={form.lookingFor}
                                    onChange={handleChange}
                                >
                                    <option value="Job">
                                        Job
                                    </option>

                                    <option value="Internship">
                                        Internship
                                    </option>

                                    <option value="Training-Internship">
                                        Training-Internship
                                    </option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Resume Link</label>

                                <input
                                    name="resumeLink"
                                    value={form.resumeLink}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setShowForm(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Follow-up Modal */}
            {showFollowUp && selectedRecord && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Take Follow-up</h3>

                            <button
                                onClick={() =>
                                    setShowFollowUp(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div className="selected-candidate">
                            <strong>
                                {selectedRecord.name}
                            </strong>

                            <span>
                                {selectedRecord.contactNumber}
                            </span>
                        </div>

                        <form onSubmit={handleFollowUpSubmit}>
                            <div className="form-group">
                                <label>Assign Employee *</label>

                                <select
                                    name="assignedEmployee"
                                    value={
                                        followUpForm.assignedEmployee
                                    }
                                    onChange={
                                        handleFollowUpChange
                                    }
                                    required
                                >
                                    <option value="">
                                        Select Employee
                                    </option>

                                    {employees.map((employee) => (
                                        <option
                                            key={employee._id}
                                            value={employee._id}
                                        >
                                            {employee.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>
                                    Next Follow-up Date *
                                </label>

                                <input
                                    type="date"
                                    name="nextFollowUpDate"
                                    value={
                                        followUpForm.nextFollowUpDate
                                    }
                                    onChange={
                                        handleFollowUpChange
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>

                                <select
                                    name="status"
                                    value={followUpForm.status}
                                    onChange={
                                        handleFollowUpChange
                                    }
                                >
                                    <option value="Pending">
                                        Pending
                                    </option>

                                    <option value="In Progress">
                                        In Progress
                                    </option>

                                    <option value="Completed">
                                        Completed
                                    </option>

                                    <option value="Not Interested">
                                        Not Interested
                                    </option>

                                    <option value="No Response">
                                        No Response
                                    </option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>
                                    Communication Notes
                                </label>

                                <textarea
                                    name="communicationNotes"
                                    value={
                                        followUpForm.communicationNotes
                                    }
                                    onChange={
                                        handleFollowUpChange
                                    }
                                    rows="4"
                                    placeholder="Write communication details..."
                                ></textarea>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setShowFollowUp(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-success"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Follow-up"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Communication History Modal */}
            {showHistory && selectedRecord && (
                <div className="modal-overlay">
                    <div className="modal-box history-modal">
                        <div className="modal-header">
                            <h3>
                                Communication History
                            </h3>

                            <button
                                onClick={() =>
                                    setShowHistory(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <h4>{selectedRecord.name}</h4>

                        {selectedRecord.followUps?.length === 0 ? (
                            <div className="empty-state">
                                No communication history found
                            </div>
                        ) : (
                            <div className="follow-up-history">
                                {[
                                    ...(selectedRecord.followUps ||
                                        []),
                                ]
                                    .reverse()
                                    .map((followUp, index) => (
                                        <div
                                            className="history-item"
                                            key={
                                                followUp._id ||
                                                index
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    {followUp
                                                        .assignedEmployee
                                                        ?.fullName ||
                                                        "Unknown Employee"}
                                                </strong>

                                                <span>
                                                    {followUp.status}
                                                </span>
                                            </div>

                                            <p>
                                                <strong>
                                                    Next Date:
                                                </strong>{" "}
                                                {followUp.nextFollowUpDate
                                                    ? new Date(
                                                        followUp.nextFollowUpDate
                                                    ).toLocaleDateString()
                                                    : "-"}
                                            </p>

                                            <p>
                                                {followUp.communicationNotes ||
                                                    "No notes added"}
                                            </p>

                                            <small>
                                                {followUp.communicationDate
                                                    ? new Date(
                                                        followUp.communicationDate
                                                    ).toLocaleString()
                                                    : ""}
                                            </small>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstagramReelData;