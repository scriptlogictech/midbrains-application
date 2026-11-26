
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    getTodayFollowUps,
    getMissedFollowUps,
    getUpcomingFollowUps,
} from "../../services/followupService";

import { getCompanyEmployeesAndInterns } from "../../services/userService";

import "./Followups.css";

const Followups = () => {
    const { companyId } = useParams();
    const navigate = useNavigate();

    const [todayFollowUps, setTodayFollowUps] = useState([]);
    const [missedFollowUps, setMissedFollowUps] = useState([]);
    const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);
    const [employeesAndInterns, setEmployeesAndInterns] = useState([]);
    const [userLoading, setUserLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("today");

    // Filters matching the Leads page.
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [inquiryTypeFilter, setInquiryTypeFilter] = useState("all");
    const [assignedCounselorFilter, setAssignedCounselorFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // FETCH FOLLOW-UPS
    const fetchFollowUps = async () => {
        try {
            setLoading(true);
            setError("");

            const [today, missed, upcoming] = await Promise.all([
                getTodayFollowUps(),
                getMissedFollowUps(),
                getUpcomingFollowUps(),
            ]);

            const todayData = today?.followUps || today || [];
            const missedData = missed?.followUps || missed || [];
            const upcomingData = upcoming?.followUps || upcoming || [];

            // Do not include Not Interested leads in any follow-up list.
            // Filtering here also keeps the tab counts accurate.
            const excludeNotInterested = (leads) =>
                (Array.isArray(leads) ? leads : []).filter(
                    (lead) =>
                        String(lead?.status || "").toLowerCase() !==
                        "not_interested"
                );

            setTodayFollowUps(excludeNotInterested(todayData));
            setMissedFollowUps(excludeNotInterested(missedData));
            setUpcomingFollowUps(excludeNotInterested(upcomingData));
        } catch (err) {
            console.error("Failed to load follow-ups:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load follow-ups."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFollowUps();
    }, []);

    // FETCH EMPLOYEES + INTERNS FOR THE ASSIGNED-TO FILTER
    useEffect(() => {
        const fetchEmployeesAndInterns = async () => {
            if (!companyId) return;

            try {
                setUserLoading(true);
                const response = await getCompanyEmployeesAndInterns(companyId);
                setEmployeesAndInterns(
                    Array.isArray(response?.users) ? response.users : []
                );
            } catch (err) {
                console.error("Failed to load employees and interns:", err);
                setEmployeesAndInterns([]);
            } finally {
                setUserLoading(false);
            }
        };

        fetchEmployeesAndInterns();
    }, [companyId]);

    const getRoleLabel = (role) => {
        if (role === "employee") return "Employee";
        if (role === "intern") return "Intern";
        return role ? String(role).replaceAll("_", " ") : "User";
    };

    // ACTIVE TAB DATA
    const activeFollowUps = useMemo(() => {
        if (activeTab === "today") return todayFollowUps;
        if (activeTab === "missed") return missedFollowUps;
        if (activeTab === "upcoming") return upcomingFollowUps;

        return [];
    }, [
        activeTab,
        todayFollowUps,
        missedFollowUps,
        upcomingFollowUps,
    ]);

    // FILTER DATA
    const filteredFollowUps = useMemo(() => {
        return activeFollowUps.filter((lead) => {
            // Never show Not Interested leads in follow-ups.
            if (
                String(lead?.status || "").toLowerCase() ===
                "not_interested"
            ) {
                return false;
            }

            const searchValue = search.toLowerCase().trim();

            const matchesSearch =
                !searchValue ||
                lead.fullName?.toLowerCase().includes(searchValue) ||
                lead.contactNumber?.toLowerCase().includes(searchValue) ||
                lead.email?.toLowerCase().includes(searchValue) ||
                lead.city?.toLowerCase().includes(searchValue) ||
                lead.courseInterested?.toLowerCase().includes(searchValue);

            const matchesStatus =
                statusFilter === "all" ||
                lead.status === statusFilter;

            const matchesPriority =
                priorityFilter === "all" ||
                lead.priority === priorityFilter;

            const matchesInquiryType =
                inquiryTypeFilter === "all" ||
                lead.inquiryType === inquiryTypeFilter;

            const assignedId =
                typeof lead.assignedCounselor === "object"
                    ? lead.assignedCounselor?._id
                    : lead.assignedCounselor;

            const matchesAssignedCounselor =
                assignedCounselorFilter === "all" ||
                String(assignedId || "") === String(assignedCounselorFilter);

            // Same date basis as the Leads page, with createdAt fallback.
            const leadDateValue = lead.leadDate || lead.createdAt;
            const leadDate = leadDateValue ? new Date(leadDateValue) : null;
            const validLeadDate =
                leadDate && !Number.isNaN(leadDate.getTime());

            const matchesStartDate =
                !startDate ||
                (validLeadDate &&
                    leadDate >= new Date(`${startDate}T00:00:00`));

            const matchesEndDate =
                !endDate ||
                (validLeadDate &&
                    leadDate <= new Date(`${endDate}T23:59:59.999`));

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesInquiryType &&
                matchesAssignedCounselor &&
                matchesStartDate &&
                matchesEndDate
            );
        });
    }, [
        activeFollowUps,
        search,
        statusFilter,
        priorityFilter,
        inquiryTypeFilter,
        assignedCounselorFilter,
        startDate,
        endDate,
    ]);

    // HELPERS
    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "-";

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (date) => {
        if (!date) return "";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "";

        return parsedDate.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatStatus = (status) => {
        if (!status) return "-";

        return status
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const getPriorityClass = (priority) => {
        const priorityMap = {
            low: "low",
            medium: "medium",
            high: "high",
        };

        return priorityMap[priority] || "medium";
    };

    const getStatusClass = (status) => {
        const statusMap = {
            new: "new",
            contacted: "contacted",
            interested: "interested",
            follow_up: "follow_up",
            converted: "converted",
            not_interested: "not_interested",
            closed: "closed",
        };

        return statusMap[status] || "default";
    };

    // VIEW LEAD
    const handleViewLead = (leadId) => {
        if (!leadId) return;

        navigate(
            `/dashboard/${companyId}/leads?leadId=${leadId}`
        );
    };

    // RESET FILTERS
    const handleResetFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setPriorityFilter("all");
        setInquiryTypeFilter("all");
        setAssignedCounselorFilter("all");
        setStartDate("");
        setEndDate("");
    };

    const tabs = [
        {
            id: "today",
            label: "Today",
            count: todayFollowUps.length,
            icon: "bi-calendar-day",
        },
        {
            id: "missed",
            label: "Missed",
            count: missedFollowUps.length,
            icon: "bi-calendar-x",
        },
        {
            id: "upcoming",
            label: "Upcoming",
            count: upcomingFollowUps.length,
            icon: "bi-calendar-check",
        },
    ];

    const activeTabTitle = {
        today: "Today's Follow-ups",
        missed: "Missed Follow-ups",
        upcoming: "Upcoming Follow-ups",
    };

    // LOADING
    if (loading) {
        return (
            <div className="leads-page followups-page">
                <div className="followups-loading">
                    <div className="spinner-border text-primary"></div>
                    <p>Loading follow-ups...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="leads-page followups-page">

            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h1>Follow-ups</h1>
                    <p>
                        Manage today's, missed and upcoming lead follow-ups.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary refresh-btn"
                    onClick={fetchFollowUps}
                    disabled={loading}
                >
                    <i className="bi bi-arrow-clockwise"></i>
                    Refresh
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle"></i>
                    {error}
                </div>
            )}

            {/* FOLLOW-UP TABS */}
            <div className="followup-tabs">
                {tabs.map((tab) => (
                    <button
                        type="button"
                        key={tab.id}
                        className={`followup-tab ${
                            activeTab === tab.id ? "active" : ""
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="followup-tab-label">
                            <i className={`bi ${tab.icon}`}></i>
                            {tab.label}
                        </span>

                        <span className="followup-tab-count">
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* FILTERS - SAME FILTER OPTIONS AS LEADS PAGE */}
            <div className="filters-card">

                <div className="filter-group search-group">
                    <label>Search</label>
                    <div className="search-input">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            name="search"
                            placeholder="Search by name, phone, email or course..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label>Status</label>
                    <select
                        name="status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Priority</label>
                    <select
                        name="priority"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="all">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Inquiry Type</label>
                    <select
                        name="inquiryType"
                        value={inquiryTypeFilter}
                        onChange={(e) => setInquiryTypeFilter(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="interview">Interview</option>
                        <option value="course">Course</option>
                        <option value="internship">Internship</option>
                        <option value="corporate_training">Corporate Training</option>
                        <option value="project">Project</option>
                        <option value="placement">Placement</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Assigned To</label>
                    <select
                        name="assignedCounselor"
                        value={assignedCounselorFilter}
                        onChange={(e) => setAssignedCounselorFilter(e.target.value)}
                    >
                        <option value="all">All Users</option>
                        {employeesAndInterns.map((item) => (
                            <option key={item._id} value={item._id}>
                                {item.fullName} ({getRoleLabel(item.role)})
                            </option>
                        ))}
                    </select>
                    {userLoading && (
                        <small className="loading-text">Loading users...</small>
                    )}
                </div>

                <div className="filter-group">
                    <label>From Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>To Date</label>
                    <input
                        type="date"
                        name="endDate"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <div className="filter-group filter-reset-group">
                    <label>&nbsp;</label>
                    <button
                        type="button"
                        className="btn btn-secondary clear-filter-btn"
                        onClick={handleResetFilters}
                    >
                        <i className="bi bi-arrow-counterclockwise"></i>
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="table-card">

                {/* TABLE HEADER */}
                <div className="table-header">
                    <div>
                        <h3>{activeTabTitle[activeTab]}</h3>

                        <span>
                            Showing {filteredFollowUps.length} follow-up
                            {filteredFollowUps.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <span className={`followup-current-label ${activeTab}`}>
                        {activeTab}
                    </span>
                </div>

                {/* EMPTY STATE */}
                {filteredFollowUps.length === 0 ? (
                    <div className="empty-state followup-empty-state">
                        <i className="bi bi-calendar-x"></i>

                        <h3>No Follow-ups Found</h3>

                        <p>
                            There are no follow-ups matching your current filters.
                        </p>

                        {(search || statusFilter !== "all" || priorityFilter !== "all") && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleResetFilters}
                            >
                                <i className="bi bi-arrow-counterclockwise"></i>
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="leads-table followups-table">
                            <thead>
                                <tr>
                                    <th>Sr. No.</th>
                                    <th>Lead</th>
                                    <th>Contact</th>
                                    <th>Course</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Follow-up Date</th>
                                    <th>Counselor</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredFollowUps.map((lead, index) => (
                                    <tr key={lead._id || lead.id || index}>

                                        {/* SERIAL NUMBER */}
                                        <td>{index + 1}</td>

                                        {/* LEAD */}
                                        <td>
                                            <div className="lead-info">
                                                <strong>
                                                    {lead.fullName || "-"}
                                                </strong>

                                                <span>
                                                    {lead.email || "-"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* CONTACT */}
                                        <td>
                                            <div className="contact-info">
                                                <span>
                                                    <i className="bi bi-telephone"></i>
                                                    {lead.contactNumber || "-"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* COURSE */}
                                        <td>
                                            <div className="inquiry-info">
                                                <strong>
                                                    {lead.courseInterested || "-"}
                                                </strong>
                                            </div>
                                        </td>

                                        {/* PRIORITY */}
                                        <td>
                                            <span
                                                className={`priority-badge ${getPriorityClass(
                                                    lead.priority
                                                )}`}
                                            >
                                                {formatStatus(lead.priority)}
                                            </span>
                                        </td>

                                        {/* STATUS */}
                                        <td>
                                            <span
                                                className={`followup-status-badge ${getStatusClass(
                                                    lead.status
                                                )}`}
                                            >
                                                {formatStatus(lead.status)}
                                            </span>
                                        </td>

                                        {/* FOLLOW-UP DATE */}
                                        <td>
                                            <div className="followup-date">
                                                <strong>
                                                    {formatDate(lead.nextFollowUpDate)}
                                                </strong>

                                                <span>
                                                    {formatTime(lead.nextFollowUpDate)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* COUNSELOR */}
                                        <td>
                                            <div className="assigned-user">
                                                <span>
                                                    {lead.assignedCounselor?.fullName ||
                                                        "Unassigned"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    type="button"
                                                    className="icon-btn view-btn"
                                                    title="View Lead"
                                                    onClick={() =>
                                                        handleViewLead(lead._id)
                                                    }
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Followups;
