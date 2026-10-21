import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    getLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    addCommunication,
    updateCommunication,
    deleteCommunication,
} from "../../services/leadService";
import { getCompanyEmployeesAndInterns } from "../../services/userService";
import "./Leads.css";

// Status list used by the filters, forms, table and legend.
// The colour of each status is defined in Leads.css (--row-* variables).
const STATUS_OPTIONS = [
    { value: "contacted", label: "Contacted" },
    { value: "interested", label: "Interested" },
    { value: "not_interested", label: "Not Interested" },
    { value: "enrolled", label: "Enrolled" },
];

// Order shown in the legend (matches the sales pipeline)
const LEGEND_ORDER = ["contacted", "interested", "enrolled", "not_interested"];

const INQUIRY_TYPES = [
    { value: "interview", label: "Interview" },
    { value: "course", label: "Course" },
    { value: "internship", label: "Internship" },
    { value: "corporate_training", label: "Corporate Training" },
    { value: "project", label: "Project" },
    { value: "placement", label: "Placement" },
];

const LEAD_SOURCES = [
    { value: "instagram", label: "Instagram" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "walkin", label: "Walk-in" },
    { value: "website", label: "Website" },
    { value: "facebook", label: "Facebook" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "phone_call", label: "Phone Call" },
    { value: "reference", label: "Reference" },
    { value: "internship", label: "Internship" },
    { value: "corporate_training", label: "Corporate Training" },
    { value: "project_client", label: "Project Client" },
];

const getLocalDateInputValue = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const Leads = () => {
    const { user } = useAuth();
    const { companyId: routeCompanyId } = useParams();

    // Super Admin does not have a company assigned.
    // For Super Admin, use the company ID from the dashboard URL first.
    // For Employee / Intern, fall back to their assigned company.
    const companyId =
        routeCompanyId ||
        user?.company?._id ||
        user?.company ||
        localStorage.getItem("companyId");

    // =========================
    // STATES
    // =========================

    const [leads, setLeads] = useState([]);
    const [employeesAndInterns, setEmployeesAndInterns] = useState([]);

    const [loading, setLoading] = useState(true);
    const [userLoading, setUserLoading] = useState(true);

    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCommunicationModal, setShowCommunicationModal] =
        useState(false);
    const [editingCommunication, setEditingCommunication] = useState(null);

    const [editingLead, setEditingLead] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);

    // =========================
    // FILTER STATES
    // =========================

    const [filters, setFilters] = useState({
        search: "",
        status: "",
        priority: "",
        inquiryType: "",
        assignedCounselor: "",
        startDate: "",
        endDate: "",
        page: 1,
        limit: 10,
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1,
    });

    // =========================
    // FORM STATES
    // =========================

    const initialForm = {
        fullName: "",
        contactNumber: "",
        email: "",
        city: "",
        courseInterested: "",
        inquiryType: "course",
        leadSource: "",
        assignedCounselor: "",
        priority: "medium",
        status: "",
        leadDate: getLocalDateInputValue(),
        nextFollowUpDate: "",
        notes: "",
        expectedFees: "",
        admissionDate: "",
    };

    const [formData, setFormData] = useState(initialForm);

    const [communicationData, setCommunicationData] = useState({
        type: "call",
        message: "",
        date: new Date().toISOString().slice(0, 10),
    });

    // =========================
    // FETCH LEADS
    // =========================

    const fetchLeads = async () => {
        if (!companyId) return;

        try {
            setLoading(true);
            setError("");

            const response = await getLeads(companyId, filters);

            const leadData = response?.data || response?.leads || [];

            setLeads(leadData);

            if (response?.pagination) {
                setPagination({
                    page: Number(response.pagination.page) || 1,
                    limit: Number(response.pagination.limit) || 10,
                    total: Number(response.pagination.total) || 0,
                    pages:
                        Number(
                            response.pagination.totalPages ??
                            response.pagination.pages
                        ) || 1,
                    totalPages:
                        Number(
                            response.pagination.totalPages ??
                            response.pagination.pages
                        ) || 1,
                    hasNextPage:
                        response.pagination.hasNextPage ??
                        (
                            Number(response.pagination.page) <
                            Number(
                                response.pagination.totalPages ??
                                response.pagination.pages
                            )
                        ),
                    hasPreviousPage:
                        response.pagination.hasPreviousPage ??
                        Number(response.pagination.page) > 1,
                });
            }
        } catch (err) {
            console.error("Fetch Leads Error:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to load leads"
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // FETCH EMPLOYEES + INTERNS
    // =========================

    const fetchEmployeesAndInterns = async () => {
        if (!companyId) return;

        try {
            setUserLoading(true);

            const response =
                await getCompanyEmployeesAndInterns(companyId);

            setEmployeesAndInterns(response?.users || []);
        } catch (err) {
            console.error(
                "Fetch Employees and Interns Error:",
                err
            );

            setEmployeesAndInterns([]);
        } finally {
            setUserLoading(false);
        }
    };

    // =========================
    // INITIAL LOAD
    // =========================

    useEffect(() => {
        if (!companyId) return;

        fetchEmployeesAndInterns();
    }, [companyId]);

    useEffect(() => {
        if (!companyId) return;

        fetchLeads();
    }, [
        companyId,
        filters.search,
        filters.status,
        filters.priority,
        filters.inquiryType,
        filters.assignedCounselor,
        filters.startDate,
        filters.endDate,
        filters.page,
        filters.limit,
    ]);

    // =========================
    // HANDLE FILTER
    // =========================

    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: 1,
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            status: "",
            priority: "",
            inquiryType: "",
            assignedCounselor: "",
            startDate: "",
            endDate: "",
            page: 1,
            limit: 10,
        });
    };

    // =========================
    // HANDLE FORM CHANGE
    // =========================

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =========================
    // OPEN CREATE MODAL
    // =========================

    const handleAddLead = () => {
        setEditingLead(null);
        setFormData(initialForm);
        setShowModal(true);
    };

    // =========================
    // OPEN EDIT MODAL
    // =========================

    const handleEditLead = (lead) => {
        setEditingLead(lead);
        setSelectedLead(lead);

        setFormData({
            fullName: lead.fullName || "",
            contactNumber: lead.contactNumber || "",
            email: lead.email || "",
            city: lead.city || "",
            courseInterested: lead.courseInterested || "",
            inquiryType: lead.inquiryType || "course",
            leadSource: lead.leadSource || "",
            assignedCounselor:
                lead.assignedCounselor?._id ||
                lead.assignedCounselor ||
                "",
            priority: lead.priority || "medium",
            status: lead.status || "",
            leadDate: lead.leadDate
                ? getLocalDateInputValue(new Date(lead.leadDate))
                : lead.createdAt
                    ? getLocalDateInputValue(new Date(lead.createdAt))
                    : getLocalDateInputValue(),
            nextFollowUpDate: lead.nextFollowUpDate
                ? new Date(lead.nextFollowUpDate)
                    .toISOString()
                    .split("T")[0]
                : "",
            notes: lead.notes || "",
            expectedFees:
                lead.expectedFees !== undefined &&
                    lead.expectedFees !== null
                    ? lead.expectedFees
                    : "",
            admissionDate: lead.admissionDate
                ? new Date(lead.admissionDate)
                    .toISOString()
                    .split("T")[0]
                : "",
        });

        setShowModal(true);
    };

    // =========================
    // SUBMIT LEAD
    // =========================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");

            const allowedStatuses = [
                "",
                "contacted",
                "interested",
                "not_interested",
                "enrolled",
            ];

            const submittedStatus = String(formData.status ?? "").trim();

            const payload = {
                ...formData,
                status: allowedStatuses.includes(submittedStatus)
                    ? submittedStatus
                    : "",
                company: companyId,
            };

            if (payload.expectedFees === "") {
                delete payload.expectedFees;
            } else {
                payload.expectedFees = Number(
                    payload.expectedFees
                );
            }

            if (!payload.assignedCounselor) {
                delete payload.assignedCounselor;
            }

            if (!payload.leadDate) {
                delete payload.leadDate;
            }

            if (!payload.nextFollowUpDate) {
                delete payload.nextFollowUpDate;
            }

            if (!payload.admissionDate) {
                delete payload.admissionDate;
            }

            if (editingLead) {
                await updateLead(
                    editingLead._id,
                    payload
                );
            } else {
                await createLead(payload);
            }

            setShowModal(false);
            setEditingLead(null);
            setFormData(initialForm);

            await fetchLeads();
        } catch (err) {
            console.error("Save Lead Error:", err);

            setError(
                err?.response?.data?.message ||
                "Failed to save lead"
            );
        }
    };

    // =========================
    // UPDATE STATUS
    // =========================

    const handleStatusChange = async (leadId, status) => {
        try {
            await updateLeadStatus(leadId, status);

            await fetchLeads();

            if (
                selectedLead &&
                selectedLead._id === leadId
            ) {
                setSelectedLead((prev) => ({
                    ...prev,
                    status,
                }));
            }
        } catch (err) {
            console.error(
                "Update Lead Status Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to update lead status"
            );
        }
    };

    // =========================
    // VIEW DETAILS
    // =========================

    const handleViewDetails = (lead) => {
        setSelectedLead(lead);
        setShowDetailsModal(true);
    };

    // =========================
    // COMMUNICATION
    // =========================

    const handleOpenCommunication = (lead) => {
        setSelectedLead(lead);

        setEditingCommunication(null);
        setCommunicationData({
            type: "call",
            message: "",
            date: new Date().toISOString().slice(0, 10),
        });

        setShowCommunicationModal(true);
    };

    const handleCommunicationChange = (e) => {
        const { name, value } = e.target;

        setCommunicationData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEditCommunication = (item) => {
        setEditingCommunication(item);
        setCommunicationData({
            type: item.type || "call",
            message: item.message || "",
            date: item.date
                ? new Date(item.date).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
        });
        setShowCommunicationModal(true);
    };

    const handleAddCommunication = async (e) => {
        e.preventDefault();
        if (!selectedLead) return;

        try {
            setError("");
            const payload = {
                ...communicationData,
                date: communicationData.date
                    ? new Date(`${communicationData.date}T12:00:00`).toISOString()
                    : undefined,
            };

            const response = editingCommunication
                ? await updateCommunication(selectedLead._id, editingCommunication._id, payload)
                : await addCommunication(selectedLead._id, payload);

            if (response?.lead) {
                setSelectedLead(response.lead);
                setLeads((prev) => prev.map((lead) =>
                    lead._id === response.lead._id ? response.lead : lead
                ));
            }

            setShowCommunicationModal(false);
            setEditingCommunication(null);
            setCommunicationData({
                type: "call",
                message: "",
                date: new Date().toISOString().slice(0, 10),
            });
            await fetchLeads();
        } catch (err) {
            console.error("Save Communication Error:", err);
            setError(
                err?.response?.data?.message ||
                `Failed to ${editingCommunication ? "update" : "add"} communication`
            );
        }
    };

    const handleDeleteCommunication = async (item) => {
        if (!selectedLead || !item?._id) {
            setError("Cannot delete this communication because its ID is missing.");
            return;
        }

        if (!window.confirm(
            "Are you sure you want to delete this communication record? This action cannot be undone."
        )) return;

        try {
            setError("");
            const response = await deleteCommunication(selectedLead._id, item._id);
            if (response?.lead) {
                setSelectedLead(response.lead);
                setLeads((prev) => prev.map((lead) =>
                    lead._id === response.lead._id ? response.lead : lead
                ));
            }
            await fetchLeads();
        } catch (err) {
            console.error("Delete Communication Error:", err);
            setError(err?.response?.data?.message || "Failed to delete communication");
        }
    };

    // =========================
    // DELETE LEAD
    // =========================

    const handleDeleteLead = async (lead) => {
        if (!lead?._id) {
            setError("Cannot delete this lead because its ID is missing.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete the lead "${lead.fullName || "this lead"}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setError("");
            await deleteLead(lead._id);
            setLeads((prev) => prev.filter((item) => item._id !== lead._id));

            if (selectedLead?._id === lead._id) {
                setSelectedLead(null);
                setShowDetailsModal(false);
                setShowCommunicationModal(false);
            }

            if (editingLead?._id === lead._id) {
                setEditingLead(null);
                setShowModal(false);
            }

            await fetchLeads();
        } catch (err) {
            console.error("Delete Lead Error:", err);
            setError(
                err?.response?.data?.message ||
                "Failed to delete lead. Check that the backend delete endpoint is configured."
            );
        }
    };

    const getCommunicationMeta = (type) => {
        const types = {
            call: { label: "Phone Call", icon: "bi-telephone-fill" },
            whatsapp: { label: "WhatsApp", icon: "bi-whatsapp" },
            email: { label: "Email", icon: "bi-envelope-fill" },
            meeting: { label: "In-person Meeting", icon: "bi-people-fill" },
        };
        return types[type] || { label: "Communication", icon: "bi-chat-left-text-fill" };
    };

    // =========================
    // PAGINATION
    // =========================

    const handlePreviousPage = () => {
        if (pagination.page <= 1) return;

        setFilters((prev) => ({
            ...prev,
            page: pagination.page - 1,
        }));
    };

    const handleNextPage = () => {
        if (pagination.page >= pagination.pages) return;

        setFilters((prev) => ({
            ...prev,
            page: pagination.page + 1,
        }));
    };


    const getPaginationItems = () => {
    const totalPages = Math.max(Number(pagination.pages) || 1, 1);
    const currentPage = Math.min(
        Math.max(Number(pagination.page) || 1, 1),
        totalPages
    );

    const pageSet = new Set([
        1,
        2,
        3,
        4,
        5,
        totalPages - 1,
        totalPages,
        currentPage - 1,
        currentPage,
        currentPage + 1,
    ]);

    const pages = [...pageSet]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((a, b) => a - b);

    const items = [];

    pages.forEach((page, index) => {
        if (index > 0) {
            const previousPage = pages[index - 1];
            const gap = page - previousPage;

            if (gap === 2) {
                items.push(previousPage + 1);
            } else if (gap > 2) {
                items.push("...");
            }
        }

        items.push(page);
    });

    return items;
};

const handlePageChange = (page) => {
    const targetPage = Number(page);

    if (
        !Number.isInteger(targetPage) ||
        targetPage < 1 ||
        targetPage > pagination.pages ||
        targetPage === pagination.page
    ) {
        return;
    }

    setFilters((prev) => ({
        ...prev,
        page: targetPage,
    }));
};

    // =========================
    // HELPERS
    // =========================

    const getUserName = (assignedUser) => {
        if (!assignedUser) return "Unassigned";

        if (typeof assignedUser === "object") {
            return assignedUser.fullName || "Unknown";
        }

        const found = employeesAndInterns.find(
            (item) => item._id === assignedUser
        );

        return found?.fullName || "Unknown";
    };

    const getUserRole = (assignedUser) => {
        if (!assignedUser) return "";

        if (typeof assignedUser === "object") {
            return assignedUser.role || "";
        }

        const found = employeesAndInterns.find(
            (item) => item._id === assignedUser
        );

        return found?.role || "";
    };

    const getRoleLabel = (role) => {
        if (role === "employee") return "Employee";
        if (role === "intern") return "Intern";

        return "";
    };

    const getStatusLabel = (status) => {
        const found = STATUS_OPTIONS.find(
            (item) => item.value === status
        );

        return found ? found.label : status;
    };

    const getLeadRowClass = (status) => {
        switch (String(status || "").toLowerCase()) {
            case "interested":
                return "lead-row-interested";

            case "enrolled":
                return "lead-row-enrolled";

            case "not_interested":
                return "lead-row-not-interested";

            case "contacted":
                return "lead-row-contacted";

            default:
                return "";
        }
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            low: "Low",
            medium: "Medium",
            high: "High",
        };

        return labels[priority] || priority;
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatInquiryType = (type) =>
        type
            ? type
                .replace(/_/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())
            : "-";

    const renderUserOptions = () =>
        employeesAndInterns.map((item) => (
            <option key={item._id} value={item._id}>
                {item.fullName} ({getRoleLabel(item.role)})
            </option>
        ));

    // =========================
    // RENDER
    // =========================

    return (
        <div className="leads-page">

            {/* ================= HEADER ================= */}

            <div className="page-header">
                <div>
                    <h1>Lead Management</h1>
                </div>

                <div className="page-header-actions">
                    <button
                        type="button"
                        className="btn btn-secondary filter-toggle-btn"
                        onClick={() => setShowFilters((prev) => !prev)}
                        aria-expanded={showFilters}
                        aria-controls="leads-filters-card"
                    >
                        <i className="bi bi-funnel"></i>
                        {showFilters ? "Hide Filters" : "Filters"}
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddLead}
                    >
                        <i className="bi bi-plus-lg"></i>
                        Add Lead
                    </button>
                </div>
            </div>

            {/* ================= ERROR ================= */}

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle"></i>
                    {error}
                </div>
            )}

            {/* ================= FILTERS ================= */}

            {showFilters && (
                <div className="filters-card" id="leads-filters-card">

                    <div className="filter-group search-group">
                        <label>Search</label>

                        <div className="search-input">
                            <i className="bi bi-search"></i>

                            <input
                                type="text"
                                name="search"
                                placeholder="Search by name, phone or email..."
                                value={filters.search}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Status</label>

                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Status</option>

                            {STATUS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Priority</label>

                        <select
                            name="priority"
                            value={filters.priority}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Inquiry Type</label>

                        <select
                            name="inquiryType"
                            value={filters.inquiryType}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Types</option>

                            {INQUIRY_TYPES.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Assigned To</label>

                        <select
                            name="assignedCounselor"
                            value={filters.assignedCounselor}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Users</option>

                            {renderUserOptions()}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>From Date</label>

                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label>To Date</label>

                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary clear-filter-btn"
                        onClick={clearFilters}
                    >
                        <i className="bi bi-x-circle"></i>
                        Clear
                    </button>
                </div>
            )}

            {/* ================= TABLE ================= */}

            <div className="table-card">

                <div className="table-header">
                    <div>
                        <h3>All Leads</h3>

                        <span>
                            {pagination.total || 0}{" "}
                            total leads
                        </span>
                    </div>

                    {/* Status colour legend */}
                    <div className="status-legend">
                        {LEGEND_ORDER.map((value) => (
                            <span className="legend-item" key={value}>
                                <i className={`legend-dot ${value}`}></i>
                                {getStatusLabel(value)}
                            </span>
                        ))}
                    </div>

                    {userLoading && (
                        <span className="loading-text">
                            Loading users...
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading leads...</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="empty-state">
                        <i className="bi bi-people"></i>

                        <h3>No Leads Found</h3>

                        <p>
                            No leads match your current
                            filters.
                        </p>

                        <button
                            className="btn btn-primary"
                            onClick={handleAddLead}
                        >
                            <i className="bi bi-plus-lg"></i>
                            Add First Lead
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="leads-table">

                                <thead>
                                    <tr>
                                        <th>Sr. No.</th>
                                        <th>Lead</th>
                                        <th>Contact</th>
                                        <th>Inquiry</th>
                                        <th>Assigned To</th>
                                        <th>Status</th>
                                        <th>Next Follow-up</th>
                                        <th>Communication History</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {leads.map((lead, index) => {
                                        const role = getUserRole(lead.assignedCounselor);
                                        const serialNumber =
                                            (Number(pagination.total) || 0) -
                                            ((Number(pagination.page || 1) - 1) *
                                                Number(pagination.limit || 10)) -
                                            index;

                                        return (
                                            <tr
                                                key={lead._id || lead.id || index}
                                                className={getLeadRowClass(lead.status)}
                                            >
                                                {/* Sr. No. */}
                                                <td>{serialNumber}</td>

                                                {/* Lead */}
                                                <td>
                                                    <div className="lead-info">
                                                        <strong>{lead.fullName || "-"}</strong>
                                                        <span>{lead.city || "-"}</span>
                                                    </div>
                                                </td>

                                                {/* Contact */}
                                                <td>
                                                    <div className="contact-info">
                                                        <span>
                                                            <i className="bi bi-telephone"></i>{" "}
                                                            {lead.contactNumber || "-"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Inquiry */}
                                                <td>
                                                    <div className="inquiry-info">
                                                        <strong>
                                                            {formatInquiryType(lead.inquiryType)}
                                                        </strong>
                                                        {lead.courseInterested && (
                                                            <span>{lead.courseInterested}</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Assigned To */}
                                                <td>
                                                    <div className="assigned-user">
                                                        <span>{getUserName(lead.assignedCounselor)}</span>
                                                        {role && <small>{getRoleLabel(role)}</small>}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    <select
                                                        className={`status-select ${lead.status || ""}`}
                                                        value={lead.status || ""}
                                                        onChange={(e) =>
                                                            handleStatusChange(
                                                                lead._id || lead.id,
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value=""></option>

                                                        {STATUS_OPTIONS.map((item) => (
                                                            <option key={item.value} value={item.value}>
                                                                {item.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Next Follow-up */}
                                                <td>{formatDate(lead.nextFollowUpDate)}</td>

                                                {/* Communication History */}
                                                <td>
                                                    {lead.communicationHistory?.length ? (
                                                        <div className="main-communication-history">
                                                            {lead.communicationHistory.map(
                                                                (item, communicationIndex) => (
                                                                    <div
                                                                        className="main-communication-item"
                                                                        key={
                                                                            item._id ||
                                                                            `${lead._id || lead.id}-communication-${communicationIndex}`
                                                                        }
                                                                    >
                                                                        <span className="main-communication-type-icon" title={getCommunicationMeta(item.type).label}>
                                                                            <i className={`bi ${getCommunicationMeta(item.type).icon}`}></i>
                                                                        </span>
                                                                        {item.date && (
                                                                            <span className="main-communication-date">
                                                                                {formatDate(item.date)}
                                                                            </span>
                                                                        )}
                                                                        <span className="main-communication-message">
                                                                            {item.message || "No message"}
                                                                        </span>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="no-communication">
                                                            No communication
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            type="button"
                                                            className="icon-btn"
                                                            title="View or Edit Lead"
                                                            aria-label="View or Edit Lead"
                                                            onClick={() => handleEditLead(lead)}
                                                        >
                                                            <i className="bi bi-pencil-square"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="icon-btn"
                                                            title="Add Communication"
                                                            onClick={() => handleOpenCommunication(lead)}
                                                        >
                                                            <i className="bi bi-chat-left-text"></i>
                                                        </button>
                                                        {/* <button
                                                            type="button"
                                                            className="icon-btn lead-delete-btn"
                                                            title="Delete Lead"
                                                            aria-label={`Delete lead ${lead.fullName || ""}`}
                                                            onClick={() => handleDeleteLead(lead)}
                                                        >
                                                            <i className="bi bi-trash3"></i>
                                                        </button> */}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>
                        </div>

                        {/* ================= PAGINATION ================= */}

                        {/* ================= NUMBERED PAGINATION ================= */}

<div className="pagination">
    <div className="pagination-info">
        Page {pagination.page || 1} of {pagination.pages || 1}
        <span> ({pagination.total || 0} total leads)</span>
    </div>

    <div className="pagination-controls">
        <button
            type="button"
            className="pagination-nav-btn"
            disabled={pagination.page <= 1}
            onClick={handlePreviousPage}
        >
            <i className="bi bi-chevron-left"></i>
            Previous
        </button>

        <div className="pagination-numbers">
            {getPaginationItems().map((item, index) =>
                item === "..." ? (
                    <span
                        key={`ellipsis-${index}`}
                        className="pagination-ellipsis"
                        aria-hidden="true"
                    >
                        ...
                    </span>
                ) : (
                    <button
                        key={item}
                        type="button"
                        className={`pagination-number ${
                            pagination.page === item ? "active" : ""
                        }`}
                        aria-label={`Go to page ${item}`}
                        aria-current={
                            pagination.page === item ? "page" : undefined
                        }
                        onClick={() => handlePageChange(item)}
                    >
                        {item}
                    </button>
                )
            )}
        </div>

        <button
            type="button"
            className="pagination-nav-btn"
            disabled={pagination.page >= pagination.pages}
            onClick={handleNextPage}
        >
            Next
            <i className="bi bi-chevron-right"></i>
        </button>
    </div>
</div>
                    </>
                )}
            </div>

            {/* =====================================================
                ADD / EDIT LEAD MODAL
            ===================================================== */}

            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="modal-content large-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="modal-header">
                            <div>
                                <h2>
                                    {editingLead
                                        ? "Edit Lead"
                                        : "Add New Lead"}
                                </h2>

                                <p>Enter lead information below.</p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="lead-form"
                        >

                            {/* PERSONAL INFORMATION */}

                            <div className="form-section">
                                <h3>Personal Information</h3>

                                <div className="form-grid">

                                    <div className="form-group">
                                        <label>Full Name *</label>

                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleFormChange}
                                            required
                                            placeholder="Enter full name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Contact Number *</label>

                                        <input
                                            type="text"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleFormChange}
                                            required
                                            placeholder="Enter contact number"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Email</label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="Enter email"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>City</label>

                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleFormChange}
                                            placeholder="Enter city"
                                        />
                                    </div>

                                </div>
                            </div>

                            {/* LEAD INFORMATION */}

                            <div className="form-section">
                                <h3>Lead Information</h3>

                                <div className="form-grid">

                                    <div className="form-group">
                                        <label>Inquiry Type *</label>

                                        <select
                                            name="inquiryType"
                                            value={formData.inquiryType}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            {INQUIRY_TYPES.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Course Interested</label>

                                        <input
                                            type="text"
                                            name="courseInterested"
                                            value={formData.courseInterested}
                                            onChange={handleFormChange}
                                            placeholder="Enter course"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Lead Source</label>

                                        <select
                                            name="leadSource"
                                            value={formData.leadSource}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">Select Source</option>

                                            {LEAD_SOURCES.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Assigned Employee / Intern</label>

                                        <select
                                            name="assignedCounselor"
                                            value={formData.assignedCounselor}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">Select Employee / Intern</option>

                                            {renderUserOptions()}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Priority</label>

                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleFormChange}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Status</label>

                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleFormChange}
                                        >
                                            <option value=""></option>

                                            {STATUS_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                </div>
                            </div>

                            {/* FOLLOW-UP INFORMATION */}

                            <div className="form-section">
                                <h3>Follow-up Information</h3>

                                <div className="form-grid">

                                    <div className="form-group">
                                        <label>Lead Date *</label>
                                        <input
                                            type="date"
                                            name="leadDate"
                                            value={formData.leadDate}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Next Follow-up Date</label>

                                        <input
                                            type="date"
                                            name="nextFollowUpDate"
                                            value={formData.nextFollowUpDate}
                                            onChange={handleFormChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Expected Fees</label>

                                        <input
                                            type="number"
                                            name="expectedFees"
                                            value={formData.expectedFees}
                                            onChange={handleFormChange}
                                            placeholder="Enter expected fees"
                                            min="0"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Admission Date</label>

                                        <input
                                            type="date"
                                            name="admissionDate"
                                            value={formData.admissionDate}
                                            onChange={handleFormChange}
                                        />
                                    </div>

                                </div>

                                <div className="form-group full-width">
                                    <label>Notes</label>

                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                        rows="4"
                                        placeholder="Add notes about this lead..."
                                    ></textarea>
                                </div>

                            </div>

                            {/* COMMUNICATION HISTORY - AVAILABLE INSIDE EDIT LEAD */}

                            {editingLead && (
                                <div className="form-section edit-lead-communication-section">
                                    <div className="section-title-row">
                                        <h3>Communication History</h3>
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={() => {
                                                setSelectedLead((prev) =>
                                                    prev?._id === editingLead._id ? prev : editingLead
                                                );
                                                setEditingCommunication(null);
                                                setCommunicationData({
                                                    type: "call",
                                                    message: "",
                                                    date: new Date().toISOString().slice(0, 10),
                                                });
                                                setShowCommunicationModal(true);
                                            }}
                                        >
                                            <i className="bi bi-plus-lg"></i> Add Communication
                                        </button>
                                    </div>

                                    {selectedLead?._id === editingLead._id && selectedLead.communicationHistory?.length ? (
                                        <div className="communication-list">
                                            {selectedLead.communicationHistory.map((item, index) => (
                                                <div className="communication-item" key={item._id || index}>
                                                    <div className="communication-type-icon" title={getCommunicationMeta(item.type).label}>
                                                        <i className={`bi ${getCommunicationMeta(item.type).icon}`}></i>
                                                    </div>
                                                    {item.date && (
                                                        <span className="communication-date-inline">{formatDate(item.date)}</span>
                                                    )}
                                                    <div className="communication-content">
                                                        <div className="communication-message-row">
                                                            <div className="communication-entry-heading">
                                                                <strong>{getCommunicationMeta(item.type).label}</strong>
                                                            </div>
                                                            <p>{item.message || "No message"}</p>
                                                        </div>
                                                        <div className="communication-entry-actions">
                                                            <button
                                                                type="button"
                                                                className="icon-btn"
                                                                title="Edit communication"
                                                                onClick={() => handleEditCommunication(item)}
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="icon-btn communication-delete-btn"
                                                                title="Delete communication"
                                                                onClick={() => handleDeleteCommunication(item)}
                                                            >
                                                                <i className="bi bi-trash3"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="empty-text">No communication history available.</p>
                                    )}
                                </div>
                            )}

                            {/* FORM ACTIONS */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    <i className="bi bi-check-lg"></i>

                                    {editingLead
                                        ? "Update Lead"
                                        : "Create Lead"}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* =====================================================
                LEAD DETAILS MODAL
            ===================================================== */}

            {showDetailsModal && selectedLead && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowDetailsModal(false)}
                >
                    <div
                        className="modal-content details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="modal-header">
                            <div>
                                <h2>Lead Details</h2>

                                <p>Complete lead information.</p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="details-content">

                            <div className="details-profile">
                                <div className="profile-icon">
                                    <i className="bi bi-person"></i>
                                </div>

                                <div>
                                    <h3>{selectedLead.fullName}</h3>

                                    <span>
                                        {getStatusLabel(selectedLead.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="details-grid">

                                <div className="detail-item">
                                    <label>Contact Number</label>
                                    <strong>{selectedLead.contactNumber}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Email</label>
                                    <strong>{selectedLead.email || "-"}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>City</label>
                                    <strong>{selectedLead.city || "-"}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Inquiry Type</label>
                                    <strong>
                                        {formatInquiryType(selectedLead.inquiryType)}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Course Interested</label>
                                    <strong>
                                        {selectedLead.courseInterested || "-"}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Lead Source</label>
                                    <strong>{selectedLead.leadSource || "-"}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Assigned Employee / Intern</label>

                                    <strong>
                                        {getUserName(selectedLead.assignedCounselor)}

                                        {getUserRole(selectedLead.assignedCounselor) && (
                                            <small>
                                                {" "}
                                                (
                                                {getRoleLabel(
                                                    getUserRole(selectedLead.assignedCounselor)
                                                )}
                                                )
                                            </small>
                                        )}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Priority</label>
                                    <strong>
                                        {getPriorityLabel(selectedLead.priority)}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Lead Date</label>
                                    <strong>{formatDate(selectedLead.leadDate || selectedLead.createdAt)}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Next Follow-up</label>
                                    <strong>
                                        {formatDate(selectedLead.nextFollowUpDate)}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Expected Fees</label>
                                    <strong>
                                        {selectedLead.expectedFees
                                            ? `₹${Number(
                                                selectedLead.expectedFees
                                            ).toLocaleString("en-IN")}`
                                            : "-"}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Admission Date</label>
                                    <strong>
                                        {formatDate(selectedLead.admissionDate)}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Created Date</label>
                                    <strong>
                                        {formatDate(selectedLead.createdAt)}
                                    </strong>
                                </div>

                            </div>

                            <div className="detail-section notes-section">
                                <label>Notes</label>

                                <p>
                                    {selectedLead.notes || "No notes available."}
                                </p>
                            </div>

                            {/* COMMUNICATION HISTORY */}

                            <div className="detail-section communication-history-section">
                                <div className="section-title-row">
                                    <h3>Communication History</h3>

                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            handleOpenCommunication(selectedLead);
                                        }}
                                    >
                                        <i className="bi bi-plus-lg"></i>
                                        Add
                                    </button>
                                </div>

                                {selectedLead.communicationHistory?.length ? (
                                    <div className="communication-list">
                                        {selectedLead.communicationHistory.map(
                                            (item, index) => (
                                                <div
                                                    className="communication-item"
                                                    key={item._id || index}
                                                >
                                                    <div className="communication-type-icon" title={getCommunicationMeta(item.type).label}>
                                                        <i className={`bi ${getCommunicationMeta(item.type).icon}`}></i>
                                                    </div>
                                                    {item.date && (
                                                        <span className="communication-date-inline">
                                                            {formatDate(item.date)}
                                                        </span>
                                                    )}

                                                    <div className="communication-content">
                                                        <div className="communication-message-row">
                                                            <div className="communication-entry-heading">
                                                                <strong>{getCommunicationMeta(item.type).label}</strong>
                                                            </div>
                                                            <p>{item.message || "No message"}</p>
                                                        </div>
                                                        <div className="communication-entry-actions">
                                                            <button type="button" className="icon-btn" title="Edit communication" onClick={() => handleEditCommunication(item)}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button type="button" className="icon-btn communication-delete-btn" title="Delete communication" onClick={() => handleDeleteCommunication(item)}>
                                                                <i className="bi bi-trash3"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="empty-text">
                                        No communication history available.
                                    </p>
                                )}
                            </div>

                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Close
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    handleEditLead(selectedLead);
                                }}
                            >
                                <i className="bi bi-pencil"></i>
                                Edit Lead
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* =====================================================
                COMMUNICATION MODAL
            ===================================================== */}

            {showCommunicationModal && selectedLead && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCommunicationModal(false)}
                >
                    <div
                        className="modal-content details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="modal-header">
                            <div>
                                <h2>{editingCommunication ? "Edit Communication" : "Add Communication"}</h2>

                                <p>
                                    Add communication details for{" "}
                                    <strong>{selectedLead.fullName}</strong>
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setShowCommunicationModal(false)}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleAddCommunication}>

                            <div className="form-group">
                                <label>Communication Type</label>

                                <select
                                    name="type"
                                    value={communicationData.type}
                                    onChange={handleCommunicationChange}
                                    required
                                >
                                    <option value="call">Phone Call</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="email">Email</option>
                                    <option value="meeting">Meeting</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Communication Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={communicationData.date}
                                    onChange={handleCommunicationChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Message / Notes</label>

                                <textarea
                                    name="message"
                                    value={communicationData.message}
                                    onChange={handleCommunicationChange}
                                    rows="5"
                                    required
                                    placeholder="Enter communication details..."
                                ></textarea>
                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCommunicationModal(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    <i className="bi bi-check-lg"></i>
                                    {editingCommunication ? "Save Changes" : "Add Communication"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

        </div>
    );
};

export default Leads;
