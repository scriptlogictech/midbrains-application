import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getTodayFollowUps,
  getMissedFollowUps,
  getUpcomingFollowUps,
} from "../../services/followupService";

const Followups = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [todayFollowUps, setTodayFollowUps] = useState([]);
  const [missedFollowUps, setMissedFollowUps] = useState([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);

  const [activeTab, setActiveTab] = useState("today");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH FOLLOW-UPS
  // ========================================

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      setError("");

      const [today, missed, upcoming] = await Promise.all([
        getTodayFollowUps(),
        getMissedFollowUps(),
        getUpcomingFollowUps(),
      ]);

      setTodayFollowUps(today?.followUps || today || []);
      setMissedFollowUps(missed?.followUps || missed || []);
      setUpcomingFollowUps(
        upcoming?.followUps || upcoming || []
      );
    } catch (error) {
      console.error("Failed to load follow-ups:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load follow-ups."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  // ========================================
  // ACTIVE DATA
  // ========================================

  const activeFollowUps = useMemo(() => {
    if (activeTab === "today") {
      return todayFollowUps;
    }

    if (activeTab === "missed") {
      return missedFollowUps;
    }

    if (activeTab === "upcoming") {
      return upcomingFollowUps;
    }

    return [];
  }, [
    activeTab,
    todayFollowUps,
    missedFollowUps,
    upcomingFollowUps,
  ]);

  // ========================================
  // FILTER DATA
  // ========================================

  const filteredFollowUps = useMemo(() => {
    return activeFollowUps.filter((lead) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        lead.fullName
          ?.toLowerCase()
          .includes(searchValue) ||
        lead.contactNumber
          ?.toLowerCase()
          .includes(searchValue) ||
        lead.email
          ?.toLowerCase()
          .includes(searchValue) ||
        lead.courseInterested
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        lead.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        lead.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    activeFollowUps,
    search,
    statusFilter,
    priorityFilter,
  ]);

  // ========================================
  // HELPERS
  // ========================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      new: "primary",
      contacted: "info",
      interested: "success",
      follow_up: "warning",
      converted: "success",
      not_interested: "secondary",
      closed: "dark",
    };

    return statusMap[status] || "secondary";
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: "success",
      medium: "warning",
      high: "danger",
    };

    return priorityMap[priority] || "secondary";
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  // ========================================
  // VIEW LEAD
  // ========================================

  const handleViewLead = (leadId) => {
    navigate(
      `/dashboard/${companyId}/leads?leadId=${leadId}`
    );
  };

  // ========================================
  // RESET FILTERS
  // ========================================

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-border text-primary"></div>

        <p className="mt-3 mb-0">
          Loading follow-ups...
        </p>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="followups-page">

      {/* PAGE HEADER */}
      <div className="dashboard-page-header">
        <div>
          <h2 className="fw-bold mb-1">
            Follow-ups
          </h2>

          <p className="text-muted mb-0">
            Manage today's, missed and upcoming lead
            follow-ups.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={fetchFollowUps}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="row g-4 mb-4">

        {/* TODAY */}
        <div className="col-md-4">
          <div
            className={`followup-summary-card ${
              activeTab === "today"
                ? "active"
                : ""
            }`}
            onClick={() => setActiveTab("today")}
          >
            <div className="followup-summary-icon today">
              <i className="bi bi-calendar-day"></i>
            </div>

            <div>
              <h6>Today's Follow-ups</h6>

              <h3>
                {todayFollowUps.length}
              </h3>

              <small className="text-muted">
                Scheduled for today
              </small>
            </div>
          </div>
        </div>

        {/* MISSED */}
        <div className="col-md-4">
          <div
            className={`followup-summary-card ${
              activeTab === "missed"
                ? "active"
                : ""
            }`}
            onClick={() => setActiveTab("missed")}
          >
            <div className="followup-summary-icon missed">
              <i className="bi bi-exclamation-circle"></i>
            </div>

            <div>
              <h6>Missed Follow-ups</h6>

              <h3>
                {missedFollowUps.length}
              </h3>

              <small className="text-muted">
                Need attention
              </small>
            </div>
          </div>
        </div>

        {/* UPCOMING */}
        <div className="col-md-4">
          <div
            className={`followup-summary-card ${
              activeTab === "upcoming"
                ? "active"
                : ""
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            <div className="followup-summary-icon upcoming">
              <i className="bi bi-calendar-check"></i>
            </div>

            <div>
              <h6>Upcoming Follow-ups</h6>

              <h3>
                {upcomingFollowUps.length}
              </h3>

              <small className="text-muted">
                Scheduled for later
              </small>
            </div>
          </div>
        </div>

      </div>

      {/* FILTER SECTION */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">

          <div className="row g-3">

            {/* SEARCH */}
            <div className="col-lg-5">
              <label className="form-label">
                Search
              </label>

              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Search name, phone, email or course..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>
            </div>

            {/* STATUS */}
            <div className="col-lg-3">
              <label className="form-label">
                Status
              </label>

              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="all">
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
                  Follow-up
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

            {/* PRIORITY */}
            <div className="col-lg-2">
              <label className="form-label">
                Priority
              </label>

              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value)
                }
              >
                <option value="all">
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

            {/* RESET */}
            <div className="col-lg-2 d-flex align-items-end">
              <button
                className="btn btn-light border w-100"
                onClick={handleResetFilters}
              >
                <i className="bi bi-x-circle me-2"></i>
                Reset
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-0 py-3">

          <div className="d-flex justify-content-between align-items-center">

            <div>
              <h5 className="mb-1 fw-bold">
                {activeTab === "today" &&
                  "Today's Follow-ups"}

                {activeTab === "missed" &&
                  "Missed Follow-ups"}

                {activeTab === "upcoming" &&
                  "Upcoming Follow-ups"}
              </h5>

              <small className="text-muted">
                Showing {filteredFollowUps.length}{" "}
                follow-up
                {filteredFollowUps.length !== 1
                  ? "s"
                  : ""}
              </small>
            </div>

            <span className="badge bg-light text-dark border">
              {activeTab.toUpperCase()}
            </span>

          </div>

        </div>

        <div className="card-body p-0">

          {filteredFollowUps.length === 0 ? (
            <div className="followup-empty">

              <div className="followup-empty-icon">
                <i className="bi bi-calendar-x"></i>
              </div>

              <h5 className="mt-3">
                No follow-ups found
              </h5>

              <p className="text-muted mb-0">
                There are no follow-ups matching
                your current filters.
              </p>

            </div>
          ) : (
            <div className="table-responsive">

              <table className="table align-middle mb-0">

                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Contact</th>
                    <th>Course</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Follow-up Date</th>
                    <th>Counselor</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredFollowUps.map((lead) => (
                    <tr key={lead._id}>

                      {/* LEAD */}
                      <td>
                        <div className="d-flex align-items-center">

                          <div className="followup-avatar">
                            {lead.fullName
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div>
                            <div className="fw-semibold">
                              {lead.fullName}
                            </div>

                            {lead.email && (
                              <small className="text-muted">
                                {lead.email}
                              </small>
                            )}
                          </div>

                        </div>
                      </td>

                      {/* CONTACT */}
                      <td>
                        {lead.contactNumber || "-"}
                      </td>

                      {/* COURSE */}
                      <td>
                        {lead.courseInterested ||
                          "-"}
                      </td>

                      {/* PRIORITY */}
                      <td>
                        <span
                          className={`badge bg-${getPriorityBadge(
                            lead.priority
                          )}`}
                        >
                          {formatStatus(
                            lead.priority
                          )}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`badge bg-${getStatusBadge(
                            lead.status
                          )}`}
                        >
                          {formatStatus(
                            lead.status
                          )}
                        </span>
                      </td>

                      {/* DATE */}
                      <td>
                        <div className="fw-semibold">
                          {formatDate(
                            lead.nextFollowUpDate
                          )}
                        </div>

                        <small className="text-muted">
                          {formatTime(
                            lead.nextFollowUpDate
                          )}
                        </small>
                      </td>

                      {/* COUNSELOR */}
                      <td>
                        {lead.assignedCounselor
                          ?.fullName || (
                          <span className="text-muted">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* ACTION */}
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            handleViewLead(
                              lead._id
                            )
                          }
                        >
                          <i className="bi bi-eye me-1"></i>
                          View
                        </button>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default Followups;