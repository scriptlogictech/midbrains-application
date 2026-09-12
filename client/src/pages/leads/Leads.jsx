import {
    useEffect,
    useState,
} from "react";

import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
    getLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    addCommunication,
} from "../../services/leadService";

import {
    getCompanyEmployeesAndInterns,
} from "../../services/userService";

import "./Leads.css";

const Leads = () => {
    const { user } = useAuth();
    const { companyId: routeCompanyId } =
        useParams();

    // ============================================================
    // COMPANY ID
    // ============================================================

    const companyId =
        routeCompanyId ||
        user?.company?._id ||
        user?.company ||
        localStorage.getItem("companyId");

    // ============================================================
    // STATES
    // ============================================================

    const [leads, setLeads] = useState([]);

    const [
        employeesAndInterns,
        setEmployeesAndInterns,
    ] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [userLoading, setUserLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [showModal, setShowModal] =
        useState(false);

    const [
        showDetailsModal,
        setShowDetailsModal,
    ] = useState(false);

    const [
        showCommunicationModal,
        setShowCommunicationModal,
    ] = useState(false);

    const [editingLead, setEditingLead] =
        useState(null);

    const [selectedLead, setSelectedLead] =
        useState(null);

    // ============================================================
    // FILTER STATES
    // ============================================================

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

    const [pagination, setPagination] =
        useState({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
        });

    // ============================================================
    // FORM STATES
    // ============================================================

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
        status: "new",
        nextFollowUpDate: "",
        notes: "",
        expectedFees: "",
        admissionDate: "",
    };

    const [formData, setFormData] =
        useState(initialForm);

    const [
        communicationData,
        setCommunicationData,
    ] = useState({
        type: "call",
        message: "",
    });

    // ============================================================
    // FETCH LEADS
    // ============================================================

    const fetchLeads = async () => {
        if (!companyId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await getLeads(
                companyId,
                filters
            );

            const leadData =
                response?.data ||
                response?.leads ||
                [];

            setLeads(leadData);

            if (response?.pagination) {
                setPagination({
                    page:
                        response.pagination.page ||
                        1,

                    limit:
                        response.pagination.limit ||
                        10,

                    total:
                        response.pagination.total ||
                        0,

                    totalPages:
                        response.pagination.totalPages ||
                        1,

                    hasNextPage:
                        response.pagination.hasNextPage ||
                        false,

                    hasPreviousPage:
                        response.pagination.hasPreviousPage ||
                        false,
                });
            }
        } catch (err) {
            console.error(
                "Fetch Leads Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to load leads"
            );
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // FETCH EMPLOYEES + INTERNS
    // ============================================================

    const fetchEmployeesAndInterns =
        async () => {
            if (!companyId) {
                setUserLoading(false);
                return;
            }

            try {
                setUserLoading(true);

                const response =
                    await getCompanyEmployeesAndInterns(
                        companyId
                    );

                const users =
                    response?.users || [];

                // ONLY EMPLOYEE + INTERN
                const allowedUsers =
                    users.filter(
                        (item) =>
                            item.role ===
                                "employee" ||
                            item.role ===
                                "intern"
                    );

                setEmployeesAndInterns(
                    allowedUsers
                );
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

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        if (!companyId) return;

        fetchEmployeesAndInterns();
    }, [companyId]);

    // ============================================================
    // FETCH LEADS WHEN FILTER CHANGES
    // ============================================================

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

    // ============================================================
    // HANDLE FILTER
    // ============================================================

    const handleFilterChange = (e) => {
        const {
            name,
            value,
        } = e.target;

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

    // ============================================================
    // HANDLE FORM CHANGE
    // ============================================================

    const handleFormChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ============================================================
    // OPEN CREATE MODAL
    // ============================================================

    const handleAddLead = () => {
        setEditingLead(null);
        setFormData(initialForm);
        setError("");
        setShowModal(true);
    };

    // ============================================================
    // OPEN EDIT MODAL
    // ============================================================

    const handleEditLead = (lead) => {
        setEditingLead(lead);

        setFormData({
            fullName:
                lead.fullName || "",

            contactNumber:
                lead.contactNumber || "",

            email:
                lead.email || "",

            city:
                lead.city || "",

            courseInterested:
                lead.courseInterested ||
                "",

            inquiryType:
                lead.inquiryType ||
                "course",

            leadSource:
                lead.leadSource || "",

            assignedCounselor:
                lead.assignedCounselor?._id ||
                lead.assignedCounselor ||
                "",

            priority:
                lead.priority ||
                "medium",

            status:
                lead.status ||
                "new",

            nextFollowUpDate:
                lead.nextFollowUpDate
                    ? new Date(
                          lead.nextFollowUpDate
                      )
                          .toISOString()
                          .split("T")[0]
                    : "",

            notes:
                lead.notes || "",

            expectedFees:
                lead.expectedFees !==
                    undefined &&
                lead.expectedFees !==
                    null
                    ? lead.expectedFees
                    : "",

            admissionDate:
                lead.admissionDate
                    ? new Date(
                          lead.admissionDate
                      )
                          .toISOString()
                          .split("T")[0]
                    : "",
        });

        setError("");
        setShowModal(true);
    };

    // ============================================================
    // CLOSE LEAD MODAL
    // ============================================================

    const closeLeadModal = () => {
        setShowModal(false);
        setEditingLead(null);
        setFormData(initialForm);
        setError("");
    };

    // ============================================================
    // SUBMIT LEAD
    // ============================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");

            if (!companyId) {
                setError(
                    "Company information is missing."
                );

                return;
            }

            const payload = {
                ...formData,
                company: companyId,
            };

            if (
                payload.expectedFees ===
                ""
            ) {
                delete payload.expectedFees;
            } else {
                payload.expectedFees =
                    Number(
                        payload.expectedFees
                    );
            }

            if (
                !payload.assignedCounselor
            ) {
                delete payload.assignedCounselor;
            }

            if (
                !payload.nextFollowUpDate
            ) {
                delete payload.nextFollowUpDate;
            }

            if (
                !payload.admissionDate
            ) {
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

            closeLeadModal();

            await fetchLeads();
        } catch (err) {
            console.error(
                "Save Lead Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Failed to save lead"
            );
        }
    };

    // ============================================================
    // UPDATE STATUS
    // ============================================================

    const handleStatusChange = async (
        leadId,
        status
    ) => {
        try {
            setError("");

            await updateLeadStatus(
                leadId,
                status
            );

            await fetchLeads();

            if (
                selectedLead &&
                selectedLead._id ===
                    leadId
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

    // ============================================================
    // VIEW DETAILS
    // ============================================================

    const handleViewDetails = (
        lead
    ) => {
        setSelectedLead(lead);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setSelectedLead(null);
        setShowDetailsModal(false);
    };

    // ============================================================
    // COMMUNICATION
    // ============================================================

    const handleOpenCommunication = (
        lead
    ) => {
        setSelectedLead(lead);

        setCommunicationData({
            type: "call",
            message: "",
        });

        setShowCommunicationModal(true);
    };

    const handleCommunicationChange =
        (e) => {
            const {
                name,
                value,
            } = e.target;

            setCommunicationData(
                (prev) => ({
                    ...prev,
                    [name]: value,
                })
            );
        };

    const handleAddCommunication =
        async (e) => {
            e.preventDefault();

            if (!selectedLead) return;

            try {
                setError("");

                if (
                    !communicationData.message.trim()
                ) {
                    setError(
                        "Communication message is required."
                    );

                    return;
                }

                await addCommunication(
                    selectedLead._id,
                    communicationData
                );

                setShowCommunicationModal(
                    false
                );

                setCommunicationData({
                    type: "call",
                    message: "",
                });

                await fetchLeads();
            } catch (err) {
                console.error(
                    "Add Communication Error:",
                    err
                );

                setError(
                    err?.response?.data
                        ?.message ||
                        "Failed to add communication"
                );
            }
        };

    // ============================================================
    // PAGINATION
    // ============================================================

    const handlePreviousPage = () => {
        if (
            !pagination.hasPreviousPage
        ) {
            return;
        }

        setFilters((prev) => ({
            ...prev,
            page:
                pagination.page - 1,
        }));
    };

    const handleNextPage = () => {
        if (!pagination.hasNextPage) {
            return;
        }

        setFilters((prev) => ({
            ...prev,
            page:
                pagination.page + 1,
        }));
    };

    // ============================================================
    // HELPERS
    // ============================================================

    const getUserName = (
        assignedUser
    ) => {
        if (!assignedUser) {
            return "Unassigned";
        }

        if (
            typeof assignedUser ===
            "object"
        ) {
            return (
                assignedUser.fullName ||
                assignedUser.name ||
                "Unknown"
            );
        }

        const user =
            employeesAndInterns.find(
                (item) =>
                    item._id ===
                    assignedUser
            );

        return (
            user?.fullName ||
            user?.name ||
            "Unknown"
        );
    };

    const getUserRole = (
        assignedUser
    ) => {
        if (!assignedUser) {
            return "";
        }

        if (
            typeof assignedUser ===
            "object"
        ) {
            return (
                assignedUser.role || ""
            );
        }

        const user =
            employeesAndInterns.find(
                (item) =>
                    item._id ===
                    assignedUser
            );

        return user?.role || "";
    };

    // ============================================================
    // ROLE LABEL
    // ============================================================

    // ONLY TWO ROLES CAN BE ASSIGNED TO A LEAD:
    // EMPLOYEE OR INTERN

    const getRoleLabel = (
        role
    ) => {
        if (
            role === "employee"
        ) {
            return "Employee";
        }

        if (
            role === "intern"
        ) {
            return "Intern";
        }

        return "";
    };

    const getStatusLabel = (
        status
    ) => {
        const labels = {
            new: "New",
            contacted: "Contacted",
            interested:
                "Interested",
            follow_up:
                "Follow Up",
            converted:
                "Converted",
            not_interested:
                "Not Interested",
            closed: "Closed",
        };

        return (
            labels[status] ||
            status
        );
    };

    const getInquiryTypeLabel = (
        type
    ) => {
        const labels = {
            course: "Course",
            internship:
                "Internship",
            corporate_training:
                "Corporate Training",
            project: "Project",
            placement:
                "Placement",
        };

        return (
            labels[type] ||
            type ||
            "-"
        );
    };

    const getPriorityLabel = (
        priority
    ) => {
        const labels = {
            low: "Low",
            medium: "Medium",
            high: "High",
        };

        return (
            labels[priority] ||
            priority
        );
    };

    const formatDate = (
        date
    ) => {
        if (!date) return "-";

        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // ============================================================
    // NO COMPANY
    // ============================================================

    if (!companyId) {
        return (
            <div className="empty-state">

                <i className="bi bi-building"></i>

                <h3>
                    Company Not Selected
                </h3>

                <p>
                    Please select a company
                    before managing leads.
                </p>

            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="leads-page">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="page-header">

                <div>

                    <h1>
                        Lead Management
                    </h1>

                    <p>
                        Manage leads,
                        assignments,
                        follow-ups and
                        communications.
                    </p>

                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={
                        handleAddLead
                    }
                >
                    <i className="bi bi-plus-lg"></i>

                    Add Lead
                </button>

            </div>

            {/* ====================================================
                ERROR
            ==================================================== */}

            {error && (
                <div className="alert alert-danger">

                    <i className="bi bi-exclamation-triangle"></i>

                    {error}

                </div>
            )}

            {/* ====================================================
                FILTERS
            ==================================================== */}

            <div className="filters-card">

                <div className="filter-group search-group">

                    <label>
                        Search
                    </label>

                    <div className="search-input">

                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            name="search"
                            placeholder="Search by name, phone or email..."
                            value={
                                filters.search
                            }
                            onChange={
                                handleFilterChange
                            }
                        />

                    </div>

                </div>

                <div className="filter-group">

                    <label>
                        Status
                    </label>

                    <select
                        name="status"
                        value={
                            filters.status
                        }
                        onChange={
                            handleFilterChange
                        }
                    >

                        <option value="">
                            All Status
                        </option>

                        <option value="new">
                            New
                        </option>

                        <option value="contacted">
                            Contacted
                        </option>

                        <option value="interested">
                            Interested
                        </option>

                        <option value="follow_up">
                            Follow Up
                        </option>

                        <option value="converted">
                            Converted
                        </option>

                        <option value="not_interested">
                            Not Interested
                        </option>

                        <option value="closed">
                            Closed
                        </option>

                    </select>

                </div>

                <div className="filter-group">

                    <label>
                        Priority
                    </label>

                    <select
                        name="priority"
                        value={
                            filters.priority
                        }
                        onChange={
                            handleFilterChange
                        }
                    >

                        <option value="">
                            All Priority
                        </option>

                        <option value="low">
                            Low
                        </option>

                        <option value="medium">
                            Medium
                        </option>

                        <option value="high">
                            High
                        </option>

                    </select>

                </div>

                <div className="filter-group">

                    <label>
                        Inquiry Type
                    </label>

                    <select
                        name="inquiryType"
                        value={
                            filters.inquiryType
                        }
                        onChange={
                            handleFilterChange
                        }
                    >

                        <option value="">
                            All Types
                        </option>

                        <option value="course">
                            Course
                        </option>

                        <option value="internship">
                            Internship
                        </option>

                        <option value="corporate_training">
                            Corporate Training
                        </option>

                        <option value="project">
                            Project
                        </option>

                        <option value="placement">
                            Placement
                        </option>

                    </select>

                </div>

                {/* =================================================
                    ASSIGNED EMPLOYEE / INTERN
                ================================================= */}

                <div className="filter-group">

                    <label>
                        Assigned Employee / Intern
                    </label>

                    <select
                        name="assignedCounselor"
                        value={
                            filters.assignedCounselor
                        }
                        onChange={
                            handleFilterChange
                        }
                    >

                        <option value="">
                            All Employees / Interns
                        </option>

                        {employeesAndInterns.map(
                            (item) => (
                                <option
                                    key={
                                        item._id
                                    }
                                    value={
                                        item._id
                                    }
                                >

                                    {
                                        item.fullName ||
                                        item.name
                                    }

                                    {" ("}

                                    {getRoleLabel(
                                        item.role
                                    )}

                                    {")"}

                                </option>
                            )
                        )}

                    </select>

                </div>

                <div className="filter-group">

                    <label>
                        From Date
                    </label>

                    <input
                        type="date"
                        name="startDate"
                        value={
                            filters.startDate
                        }
                        onChange={
                            handleFilterChange
                        }
                    />

                </div>

                <div className="filter-group">

                    <label>
                        To Date
                    </label>

                    <input
                        type="date"
                        name="endDate"
                        value={
                            filters.endDate
                        }
                        onChange={
                            handleFilterChange
                        }
                    />

                </div>

                <button
                    type="button"
                    className="btn btn-secondary clear-filter-btn"
                    onClick={
                        clearFilters
                    }
                >

                    <i className="bi bi-x-circle"></i>

                    Clear

                </button>

            </div>

            {/* ====================================================
                TABLE
            ==================================================== */}

            <div className="table-card">

                <div className="table-header">

                    <div>

                        <h3>
                            All Leads
                        </h3>

                        <span>
                            {
                                pagination.total ||
                                0
                            }{" "}
                            total leads
                        </span>

                    </div>

                    {userLoading && (
                        <span className="loading-text">
                            Loading employees and interns...
                        </span>
                    )}

                </div>

                {loading ? (

                    <div className="loading-container">

                        <div className="spinner"></div>

                        <p>
                            Loading leads...
                        </p>

                    </div>

                ) : leads.length === 0 ? (

                    <div className="empty-state">

                        <i className="bi bi-people"></i>

                        <h3>
                            No Leads Found
                        </h3>

                        <p>
                            No leads match
                            your current
                            filters.
                        </p>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={
                                handleAddLead
                            }
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

                                        <th>
                                            Lead
                                        </th>

                                        <th>
                                            Contact
                                        </th>

                                        <th>
                                            Inquiry
                                        </th>

                                        <th>
                                            Assigned Employee / Intern
                                        </th>

                                        <th>
                                            Priority
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Next Follow-up
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {leads.map(
                                        (lead) => {

                                            const role =
                                                getUserRole(
                                                    lead.assignedCounselor
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        lead._id
                                                    }
                                                >

                                                    {/* LEAD */}

                                                    <td>

                                                        <div className="lead-info">

                                                            <strong>
                                                                {
                                                                    lead.fullName
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    lead.city ||
                                                                    "-"
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>

                                                    {/* CONTACT */}

                                                    <td>

                                                        <div className="contact-info">

                                                            <span>

                                                                <i className="bi bi-telephone"></i>

                                                                {
                                                                    lead.contactNumber
                                                                }

                                                            </span>

                                                            {lead.email && (
                                                                <span>

                                                                    <i className="bi bi-envelope"></i>

                                                                    {
                                                                        lead.email
                                                                    }

                                                                </span>
                                                            )}

                                                        </div>

                                                    </td>

                                                    {/* INQUIRY */}

                                                    <td>

                                                        <div className="inquiry-info">

                                                            <strong>
                                                                {getInquiryTypeLabel(
                                                                    lead.inquiryType
                                                                )}
                                                            </strong>

                                                            {lead.courseInterested && (
                                                                <span>
                                                                    {
                                                                        lead.courseInterested
                                                                    }
                                                                </span>
                                                            )}

                                                        </div>

                                                    </td>

                                                    {/* ASSIGNED USER */}

                                                    <td>

                                                        <div className="assigned-user">

                                                            <span>
                                                                {getUserName(
                                                                    lead.assignedCounselor
                                                                )}
                                                            </span>

                                                            {role && (
                                                                <small>
                                                                    {getRoleLabel(
                                                                        role
                                                                    )}
                                                                </small>
                                                            )}

                                                        </div>

                                                    </td>

                                                    {/* PRIORITY */}

                                                    <td>

                                                        <span
                                                            className={`priority-badge ${lead.priority}`}
                                                        >
                                                            {getPriorityLabel(
                                                                lead.priority
                                                            )}
                                                        </span>

                                                    </td>

                                                    {/* STATUS */}

                                                    <td>

                                                        <select
                                                            className={`status-select ${lead.status}`}
                                                            value={
                                                                lead.status
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleStatusChange(
                                                                    lead._id,
                                                                    e.target.value
                                                                )
                                                            }
                                                        >

                                                            <option value="new">
                                                                New
                                                            </option>

                                                            <option value="contacted">
                                                                Contacted
                                                            </option>

                                                            <option value="interested">
                                                                Interested
                                                            </option>

                                                            <option value="follow_up">
                                                                Follow Up
                                                            </option>

                                                            <option value="converted">
                                                                Converted
                                                            </option>

                                                            <option value="not_interested">
                                                                Not Interested
                                                            </option>

                                                            <option value="closed">
                                                                Closed
                                                            </option>

                                                        </select>

                                                    </td>

                                                    {/* NEXT FOLLOW-UP */}

                                                    <td>

                                                        {formatDate(
                                                            lead.nextFollowUpDate
                                                        )}

                                                    </td>

                                                    {/* ACTIONS */}

                                                    <td>

                                                        <div className="action-buttons">

                                                            <button
                                                                type="button"
                                                                className="icon-btn"
                                                                title="View Details"
                                                                onClick={() =>
                                                                    handleViewDetails(
                                                                        lead
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-eye"></i>

                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="icon-btn"
                                                                title="Edit Lead"
                                                                onClick={() =>
                                                                    handleEditLead(
                                                                        lead
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-pencil"></i>

                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="icon-btn"
                                                                title="Add Communication"
                                                                onClick={() =>
                                                                    handleOpenCommunication(
                                                                        lead
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-chat-left-text"></i>

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* PAGINATION */}

                        <div className="pagination">

                            <span>

                                Page{" "}

                                {
                                    pagination.page
                                }{" "}

                                of{" "}

                                {
                                    pagination.totalPages
                                }

                            </span>

                            <div>

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={
                                        !pagination.hasPreviousPage
                                    }
                                    onClick={
                                        handlePreviousPage
                                    }
                                >

                                    <i className="bi bi-chevron-left"></i>

                                    Previous

                                </button>

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={
                                        !pagination.hasNextPage
                                    }
                                    onClick={
                                        handleNextPage
                                    }
                                >

                                    Next

                                    <i className="bi bi-chevron-right"></i>

                                </button>

                            </div>

                        </div>

                    </>

                )}

            </div>

            {/* ====================================================
                ADD / EDIT LEAD MODAL
            ==================================================== */}

            {showModal && (

                <div
                    className="modal-overlay"
                    onClick={
                        closeLeadModal
                    }
                >

                    <div
                        className="modal-content large-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>

                                    {editingLead
                                        ? "Edit Lead"
                                        : "Add New Lead"}

                                </h2>

                                <p>
                                    Enter lead
                                    information
                                    below.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={
                                    closeLeadModal
                                }
                            >

                                <i className="bi bi-x-lg"></i>

                            </button>

                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="lead-form"
                        >

                            {/* PERSONAL INFORMATION */}

                            <div className="form-section">

                                <h3>
                                    Personal
                                    Information
                                </h3>

                                <div className="form-grid">

                                    <div className="form-group">

                                        <label>
                                            Full Name *
                                        </label>

                                        <input
                                            type="text"
                                            name="fullName"
                                            value={
                                                formData.fullName
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            required
                                            placeholder="Enter full name"
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Contact Number *
                                        </label>

                                        <input
                                            type="text"
                                            name="contactNumber"
                                            value={
                                                formData.contactNumber
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            required
                                            placeholder="Enter contact number"
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Email
                                        </label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={
                                                formData.email
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Enter email"
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            City
                                        </label>

                                        <input
                                            type="text"
                                            name="city"
                                            value={
                                                formData.city
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Enter city"
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* LEAD INFORMATION */}

                            <div className="form-section">

                                <h3>
                                    Lead Information
                                </h3>

                                <div className="form-grid">

                                    <div className="form-group">

                                        <label>
                                            Inquiry Type *
                                        </label>

                                        <select
                                            name="inquiryType"
                                            value={
                                                formData.inquiryType
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            required
                                        >

                                            <option value="course">
                                                Course
                                            </option>

                                            <option value="internship">
                                                Internship
                                            </option>

                                            <option value="corporate_training">
                                                Corporate Training
                                            </option>

                                            <option value="project">
                                                Project
                                            </option>

                                            <option value="placement">
                                                Placement
                                            </option>

                                        </select>

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Course Interested
                                        </label>

                                        <input
                                            type="text"
                                            name="courseInterested"
                                            value={
                                                formData.courseInterested
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Enter course"
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Lead Source
                                        </label>

                                        <select
                                            name="leadSource"
                                            value={
                                                formData.leadSource
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                        >

                                            <option value="">
                                                Select Source
                                            </option>

                                            <option value="instagram">
                                                Instagram
                                            </option>

                                            <option value="whatsapp">
                                                WhatsApp
                                            </option>

                                            <option value="walkin">
                                                Walk-in
                                            </option>

                                            <option value="website">
                                                Website
                                            </option>

                                            <option value="facebook">
                                                Facebook
                                            </option>

                                            <option value="linkedin">
                                                LinkedIn
                                            </option>

                                            <option value="phone_call">
                                                Phone Call
                                            </option>

                                            <option value="reference">
                                                Reference
                                            </option>

                                            <option value="internship">
                                                Internship
                                            </option>

                                            <option value="corporate_training">
                                                Corporate Training
                                            </option>

                                            <option value="project_client">
                                                Project Client
                                            </option>

                                        </select>

                                    </div>

                                    {/* ASSIGNED EMPLOYEE / INTERN */}

                                    <div className="form-group">

                                        <label>
                                            Assigned Employee / Intern
                                        </label>

                                        <select
                                            name="assignedCounselor"
                                            value={
                                                formData.assignedCounselor
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                        >

                                            <option value="">
                                                Select Employee / Intern
                                            </option>

                                            {employeesAndInterns.map(
                                                (
                                                    item
                                                ) => (
                                                    <option
                                                        key={
                                                            item._id
                                                        }
                                                        value={
                                                            item._id
                                                        }
                                                    >

                                                        {
                                                            item.fullName ||
                                                            item.name
                                                        }

                                                        {" ("}

                                                        {getRoleLabel(
                                                            item.role
                                                        )}

                                                        {")"}

                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Priority
                                        </label>

                                        <select
                                            name="priority"
                                            value={
                                                formData.priority
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                        >

                                            <option value="low">
                                                Low
                                            </option>

                                            <option value="medium">
                                                Medium
                                            </option>

                                            <option value="high">
                                                High
                                            </option>

                                        </select>

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Status
                                        </label>

                                        <select
                                            name="status"
                                            value={
                                                formData.status
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                        >

                                            <option value="new">
                                                New
                                            </option>

                                            <option value="contacted">
                                                Contacted
                                            </option>

                                            <option value="interested">
                                                Interested
                                            </option>

                                            <option value="follow_up">
                                                Follow Up
                                            </option>

                                            <option value="converted">
                                                Converted
                                            </option>

                                            <option value="not_interested">
                                                Not Interested
                                            </option>

                                            <option value="closed">
                                                Closed
                                            </option>

                                        </select>

                                    </div>

                                </div>

                            </div>

                            {/* FOLLOW-UP INFORMATION */}

                            <div className="form-section">

                                <h3>
                                    Follow-up
                                    Information
                                </h3>

                                <div className="form-grid">

                                    <div className="form-group">

                                        <label>
                                            Next Follow-up Date
                                        </label>

                                        <input
                                            type="date"
                                            name="nextFollowUpDate"
                                            value={
                                                formData.nextFollowUpDate
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Expected Fees
                                        </label>

                                        <input
                                            type="number"
                                            name="expectedFees"
                                            value={
                                                formData.expectedFees
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            placeholder="Enter expected fees"
                                            min="0"
                                        />

                                    </div>

                                    <div className="form-group">

                                        <label>
                                            Admission Date
                                        </label>

                                        <input
                                            type="date"
                                            name="admissionDate"
                                            value={
                                                formData.admissionDate
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="form-group full-width">

                                    <label>
                                        Notes
                                    </label>

                                    <textarea
                                        name="notes"
                                        value={
                                            formData.notes
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="4"
                                        placeholder="Add notes about this lead..."
                                    ></textarea>

                                </div>

                            </div>

                            {/* FORM ACTIONS */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={
                                        closeLeadModal
                                    }
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

            {/* ====================================================
                LEAD DETAILS MODAL
            ==================================================== */}

            {showDetailsModal &&
                selectedLead && (

                    <div
                        className="modal-overlay"
                        onClick={
                            closeDetailsModal
                        }
                    >

                        <div
                            className="modal-content"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="modal-header">

                                <div>

                                    <h2>
                                        Lead Details
                                    </h2>

                                    <p>
                                        Complete lead
                                        information.
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={
                                        closeDetailsModal
                                    }
                                >

                                    <i className="bi bi-x-lg"></i>

                                </button>

                            </div>

                            <div className="details-content">

                                {/* PROFILE */}

                                <div className="details-profile">

                                    <div className="profile-icon">

                                        <i className="bi bi-person"></i>

                                    </div>

                                    <div>

                                        <h3>
                                            {
                                                selectedLead.fullName
                                            }
                                        </h3>

                                        <span>
                                            {getStatusLabel(
                                                selectedLead.status
                                            )}
                                        </span>

                                    </div>

                                </div>

                                {/* DETAILS */}

                                <div className="details-grid">

                                    <div className="detail-item">

                                        <label>
                                            Contact Number
                                        </label>

                                        <strong>
                                            {
                                                selectedLead.contactNumber
                                            }
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Email
                                        </label>

                                        <strong>
                                            {
                                                selectedLead.email ||
                                                "-"
                                            }
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            City
                                        </label>

                                        <strong>
                                            {
                                                selectedLead.city ||
                                                "-"
                                            }
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Inquiry Type
                                        </label>

                                        <strong>
                                            {getInquiryTypeLabel(
                                                selectedLead.inquiryType
                                            )}
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Course Interested
                                        </label>

                                        <strong>
                                            {
                                                selectedLead.courseInterested ||
                                                "-"
                                            }
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Lead Source
                                        </label>

                                        <strong>
                                            {
                                                selectedLead.leadSource ||
                                                "-"
                                            }
                                        </strong>

                                    </div>

                                    {/* ASSIGNED USER */}

                                    <div className="detail-item">

                                        <label>
                                            Assigned Employee / Intern
                                        </label>

                                        <strong>

                                            {getUserName(
                                                selectedLead.assignedCounselor
                                            )}

                                            {getUserRole(
                                                selectedLead.assignedCounselor
                                            ) && (
                                                <small>
                                                    {" ("}

                                                    {getRoleLabel(
                                                        getUserRole(
                                                            selectedLead.assignedCounselor
                                                        )
                                                    )}

                                                    {")"}
                                                </small>
                                            )}

                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Priority
                                        </label>

                                        <strong>
                                            {getPriorityLabel(
                                                selectedLead.priority
                                            )}
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Next Follow-up
                                        </label>

                                        <strong>
                                            {formatDate(
                                                selectedLead.nextFollowUpDate
                                            )}
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Expected Fees
                                        </label>

                                        <strong>

                                            {selectedLead.expectedFees
                                                ? `₹${Number(
                                                      selectedLead.expectedFees
                                                  ).toLocaleString(
                                                      "en-IN"
                                                  )}`
                                                : "-"}

                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Admission Date
                                        </label>

                                        <strong>
                                            {formatDate(
                                                selectedLead.admissionDate
                                            )}
                                        </strong>

                                    </div>

                                    <div className="detail-item">

                                        <label>
                                            Created Date
                                        </label>

                                        <strong>
                                            {formatDate(
                                                selectedLead.createdAt
                                            )}
                                        </strong>

                                    </div>

                                </div>

                                {/* NOTES */}

                                <div className="detail-section">

                                    <label>
                                        Notes
                                    </label>

                                    <p>
                                        {
                                            selectedLead.notes ||
                                            "No notes available."
                                        }
                                    </p>

                                </div>

                                {/* COMMUNICATION HISTORY */}

                                <div className="detail-section">

                                    <div className="section-title-row">

                                        <h3>
                                            Communication
                                            History
                                        </h3>

                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={() => {

                                                setShowDetailsModal(
                                                    false
                                                );

                                                handleOpenCommunication(
                                                    selectedLead
                                                );

                                            }}
                                        >

                                            <i className="bi bi-plus-lg"></i>

                                            Add

                                        </button>

                                    </div>

                                    {selectedLead
                                        .communicationHistory
                                        ?.length ? (

                                        <div className="communication-list">

                                            {[
                                                ...selectedLead.communicationHistory,
                                            ]
                                                .reverse()
                                                .map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <div
                                                            className="communication-item"
                                                            key={
                                                                index
                                                            }
                                                        >

                                                            <div className="communication-icon">

                                                                <i
                                                                    className={`bi ${
                                                                        item.type ===
                                                                        "call"
                                                                            ? "bi-telephone"
                                                                            : item.type ===
                                                                              "whatsapp"
                                                                            ? "bi-whatsapp"
                                                                            : item.type ===
                                                                              "email"
                                                                            ? "bi-envelope"
                                                                            : "bi-people"
                                                                    }`}
                                                                ></i>

                                                            </div>

                                                            <div className="communication-content">

                                                                <div>

                                                                    <strong>
                                                                        {
                                                                            item.type
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        {formatDate(
                                                                            item.date
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                <p>
                                                                    {
                                                                        item.message
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    )
                                                )}

                                        </div>

                                    ) : (

                                        <p className="empty-text">
                                            No communication
                                            history
                                            available.
                                        </p>

                                    )}

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={
                                        closeDetailsModal
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {

                                        setShowDetailsModal(
                                            false
                                        );

                                        handleEditLead(
                                            selectedLead
                                        );

                                    }}
                                >

                                    <i className="bi bi-pencil"></i>

                                    Edit Lead

                                </button>

                            </div>

                        </div>

                    </div>

                )}

            {/* ====================================================
                COMMUNICATION MODAL
            ==================================================== */}

            {showCommunicationModal &&
                selectedLead && (

                    <div
                        className="modal-overlay"
                        onClick={() =>
                            setShowCommunicationModal(
                                false
                            )
                        }
                    >

                        <div
                            className="modal-content"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="modal-header">

                                <div>

                                    <h2>
                                        Add Communication
                                    </h2>

                                    <p>
                                        Add communication
                                        details for{" "}

                                        <strong>
                                            {
                                                selectedLead.fullName
                                            }
                                        </strong>

                                    </p>

                                </div>

                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() =>
                                        setShowCommunicationModal(
                                            false
                                        )
                                    }
                                >

                                    <i className="bi bi-x-lg"></i>

                                </button>

                            </div>

                            <form
                                onSubmit={
                                    handleAddCommunication
                                }
                            >

                                <div className="form-group">

                                    <label>
                                        Communication Type
                                    </label>

                                    <select
                                        name="type"
                                        value={
                                            communicationData.type
                                        }
                                        onChange={
                                            handleCommunicationChange
                                        }
                                        required
                                    >

                                        <option value="call">
                                            Phone Call
                                        </option>

                                        <option value="whatsapp">
                                            WhatsApp
                                        </option>

                                        <option value="email">
                                            Email
                                        </option>

                                        <option value="meeting">
                                            Meeting
                                        </option>

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>
                                        Message / Notes
                                    </label>

                                    <textarea
                                        name="message"
                                        value={
                                            communicationData.message
                                        }
                                        onChange={
                                            handleCommunicationChange
                                        }
                                        rows="5"
                                        required
                                        placeholder="Enter communication details..."
                                    ></textarea>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setShowCommunicationModal(
                                                false
                                            )
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >

                                        <i className="bi bi-check-lg"></i>

                                        Add Communication

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