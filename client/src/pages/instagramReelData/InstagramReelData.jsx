
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";
import "./InstagramReelData.css";

const emptyForm = {
    name: "",
    contactNumber: "",
    email: "",
    lookingFor: "Job",
    resumeLink: "",
    company: "",
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

    // =========================
    // FETCH RECORDS
    // =========================

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

    // =========================
    // FETCH EMPLOYEES
    // =========================

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

    // =========================
    // FETCH COMPANIES
    // =========================

    const fetchCompanies = async () => {
        try {
            const response = await api.get("/companies");

            const companyData = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];

            setCompanies(companyData);
        } catch (error) {
            console.error("Fetch companies error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to fetch companies"
            );
        }
    };

    useEffect(() => {
        fetchRecords();
        fetchEmployees();
        fetchCompanies();
    }, []);

    // =========================
    // INPUT CHANGE
    // =========================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =========================
    // FOLLOW-UP INPUT CHANGE
    // =========================

    const handleFollowUpChange = (event) => {
        const { name, value } = event.target;

        setFollowUpForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =========================
    // OPEN ADD FORM
    // =========================

    const openAddForm = () => {
        setForm({
            ...emptyForm,
            company: "",
        });

        setEditingId(null);
        setShowForm(true);
    };

    // =========================
    // OPEN EDIT FORM
    // =========================

    const openEditForm = (record) => {
        const companyId =
            typeof record.company === "object"
                ? record.company?._id
                : record.company || "";

        setForm({
            name: record.name || "",
            contactNumber: record.contactNumber || "",
            email: record.email || "",
            lookingFor: record.lookingFor || "Job",
            resumeLink: record.resumeLink || "",
            company: companyId,
        });

        setEditingId(record._id);
        setShowForm(true);
    };

    // =========================
    // SAVE RECORD
    // =========================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (
            !form.name.trim() ||
            !form.contactNumber.trim()
        ) {
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
                    {
                        name: form.name,
                        contactNumber: form.contactNumber,
                        email: form.email,
                        lookingFor: form.lookingFor,
                        resumeLink: form.resumeLink,
                    }
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

    // =========================
    // DELETE RECORD
    // =========================

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
                previous.filter(
                    (record) => record._id !== id
                )
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

    // =========================
    // OPEN FOLLOW-UP
    // =========================

    const openFollowUp = (record) => {
        setSelectedRecord(record);
        setFollowUpForm(emptyFollowUp);
        setShowFollowUp(true);
    };

    // =========================
    // GET EMPLOYEES FOR COMPANY
    // =========================

    const getRecordCompanyId = (record) => {
        if (!record?.company) return "";

        return typeof record.company === "object"
            ? record.company?._id
            : record.company;
    };

    const selectedRecordCompanyId =
        getRecordCompanyId(selectedRecord);

    const availableEmployees = employees.filter(
        (employee) => {
            const employeeCompanyId =
                typeof employee.company === "object"
                    ? employee.company?._id
                    : employee.company;

            if (!selectedRecordCompanyId) {
                return true;
            }

            return (
                String(employeeCompanyId) ===
                String(selectedRecordCompanyId)
            );
        }
    );

    // =========================
    // ADD FOLLOW-UP
    // =========================

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

    // =========================
    // COMMUNICATION HISTORY
    // =========================

    const openHistory = (record) => {
        setSelectedRecord(record);
        setShowHistory(true);
    };

    // =========================
    // EXCEL HELPERS
    // =========================

    const normalizeHeader = (value) => {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    };

    const getSheetValue = (row, possibleHeaders) => {
        const rowKeys = Object.keys(row);

        const matchingKey = rowKeys.find((key) =>
            possibleHeaders.includes(
                normalizeHeader(key)
            )
        );

        return matchingKey ? row[matchingKey] : "";
    };

    const getCompanyFromSheet = (row) => {
        const companyValue = String(
            getSheetValue(row, [
                "company",
                "companyname",
                "companycode",
            ]) || ""
        )
            .trim()
            .toLowerCase();

        if (!companyValue) {
            return companies[0]?._id || "";
        }

        const matchingCompany = companies.find(
            (company) => {
                const name =
                    String(
                        company.companyName || ""
                    ).toLowerCase();

                const code =
                    String(
                        company.companyCode || ""
                    ).toLowerCase();

                return (
                    name === companyValue ||
                    code === companyValue ||
                    String(company._id) === companyValue
                );
            }
        );

        return matchingCompany?._id || "";
    };

    // =========================
    // UPLOAD EXCEL OR CSV
    // =========================

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!companies.length) {
            alert(
                "Companies are not loaded. Please try again."
            );

            return;
        }

        try {
            setSaving(true);

            const buffer = await file.arrayBuffer();

            const workbook = XLSX.read(buffer, {
                type: "array",
            });

            const worksheet =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const rows =
                XLSX.utils.sheet_to_json(worksheet);

            if (!rows.length) {
                alert("The uploaded file is empty");
                return;
            }

            let successCount = 0;

            for (const row of rows) {
                const record = {
                    name: String(
                        getSheetValue(row, [
                            "name",
                            "fullname",
                            "studentname",
                            "candidatename",
                        ]) || ""
                    ).trim(),

                    contactNumber: String(
                        getSheetValue(row, [
                            "contactnumber",
                            "mobilenumber",
                            "phone",
                            "mobile",
                            "contact",
                        ]) || ""
                    ).trim(),

                    email: String(
                        getSheetValue(row, [
                            "email",
                            "emailid",
                            "mail",
                        ]) || ""
                    ).trim(),

                    lookingFor:
                        getSheetValue(row, [
                            "lookingfor",
                            "requirement",
                            "interestedin",
                        ]) || "Job",

                    resumeLink: String(
                        getSheetValue(row, [
                            "resumelink",
                            "resume",
                            "cv",
                        ]) || ""
                    ).trim(),

                    company: getCompanyFromSheet(row),
                };

                if (
                    !record.name ||
                    !record.contactNumber
                ) {
                    continue;
                }

                if (!record.company) {
                    console.error(
                        "Company not found for row:",
                        row
                    );

                    continue;
                }

                try {
                    await api.post(
                        "/instagram-reel-data",
                        record
                    );

                    successCount++;
                } catch (error) {
                    console.error(
                        "Failed to upload row:",
                        error
                    );
                }
            }

            alert(
                `${successCount} records uploaded successfully`
            );

            await fetchRecords();
        } catch (error) {
            console.error(
                "File upload error:",
                error
            );

            alert("Failed to read uploaded file");
        } finally {
            setSaving(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // =========================
    // COMPANY NAME HELPER
    // =========================

    const getCompanyName = (record) => {
        if (!record?.company) return "-";

        if (typeof record.company === "object") {
            return (
                record.company.companyName ||
                record.company.companyCode ||
                "-"
            );
        }

        const company = companies.find(
            (item) =>
                String(item._id) ===
                String(record.company)
        );

        return (
            company?.companyName ||
            company?.companyCode ||
            "-"
        );
    };

    // =========================
    // FILTER RECORDS
    // =========================

    const filteredRecords = records.filter((record) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            record.name
                ?.toLowerCase()
                .includes(searchText) ||
            record.contactNumber
                ?.toLowerCase()
                .includes(searchText) ||
            record.email
                ?.toLowerCase()
                .includes(searchText) ||
            getCompanyName(record)
                ?.toLowerCase()
                .includes(searchText);

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
                        Manage Instagram candidates and
                        follow-ups
                    </p>
                </div>

                <div className="instagram-reel-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
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
                    placeholder="Search by name, phone, email or company..."
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
                    <option value="All">
                        All Status
                    </option>
                    <option value="Not Started">
                        Not Started
                    </option>
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
                                <th>Company</th>
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
                                            {getCompanyName(
                                                record
                                            )}
                                        </td>

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

            {/* ADD / EDIT MODAL */}
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
                                type="button"
                                onClick={() =>
                                    setShowForm(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {!editingId && (
                                <div className="form-group">
                                    <label>
                                        Company *
                                    </label>

                                    <select
                                        name="company"
                                        value={form.company}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select Company
                                        </option>

                                        {companies.map(
                                            (company) => (
                                                <option
                                                    key={
                                                        company._id
                                                    }
                                                    value={
                                                        company._id
                                                    }
                                                >
                                                    {company.companyName ||
                                                        company.companyCode}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            )}

                            {editingId && (
                                <div className="form-group">
                                    <label>
                                        Company
                                    </label>

                                    <input
                                        value={getCompanyName({
                                            company:
                                                form.company,
                                        })}
                                        disabled
                                    />
                                </div>
                            )}

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
                                <label>
                                    Contact Number *
                                </label>

                                <input
                                    name="contactNumber"
                                    value={
                                        form.contactNumber
                                    }
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
                                <label>
                                    Looking For
                                </label>

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
                                <label>
                                    Resume Link
                                </label>

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

            {/* FOLLOW-UP MODAL */}
            {showFollowUp && selectedRecord && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Take Follow-up</h3>

                            <button
                                type="button"
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

                            <span>
                                {getCompanyName(
                                    selectedRecord
                                )}
                            </span>
                        </div>

                        <form
                            onSubmit={handleFollowUpSubmit}
                        >
                            <div className="form-group">
                                <label>
                                    Assign Employee *
                                </label>

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

                                    {availableEmployees.map(
                                        (employee) => (
                                            <option
                                                key={
                                                    employee._id
                                                }
                                                value={
                                                    employee._id
                                                }
                                            >
                                                {employee.fullName}
                                            </option>
                                        )
                                    )}
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

            {/* HISTORY MODAL */}
            {showHistory && selectedRecord && (
                <div className="modal-overlay">
                    <div className="modal-box history-modal">
                        <div className="modal-header">
                            <h3>
                                Communication History
                            </h3>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowHistory(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <h4>{selectedRecord.name}</h4>

                        {selectedRecord.followUps?.length ===
                        0 ? (
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
                                    .map(
                                        (
                                            followUp,
                                            index
                                        ) => (
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
                                                        {
                                                            followUp.status
                                                        }
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
                                        )
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstagramReelData;