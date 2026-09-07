import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getLeads,
  createLead,
  updateLead,
  updateLeadStatus,
  addCommunication,
} from "../../services/leadService";

import { getCompanyCounselors } from "../../services/userService";

const initialForm = {
  fullName: "",
  contactNumber: "",
  email: "",
  city: "",
  courseInterested: "",
  inquiryType: "course",
  leadSource: "website",
  assignedCounselor: "",
  priority: "medium",
  status: "new",
  nextFollowUpDate: "",
  notes: "",
  expectedFees: "",
  admissionDate: "",
};

const Leads = () => {
  const { companyId } = useParams();

  const [leads, setLeads] = useState([]);
  const [counselors, setCounselors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [counselorLoading, setCounselorLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // =========================
  // PAGINATION
  // =========================

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [showModal, setShowModal] = useState(false);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [editingLead, setEditingLead] = useState(null);

  const [selectedLead, setSelectedLead] =
    useState(null);

  const [formData, setFormData] = useState(initialForm);

  const [communication, setCommunication] =
    useState({
      type: "call",
      message: "",
    });

  // =========================
  // FETCH DATA
  // =========================

  useEffect(() => {
    fetchLeads();
  }, [
    companyId,
    page,
    search,
    statusFilter,
    priorityFilter,
    sourceFilter,
  ]);

  useEffect(() => {
    fetchCounselors();
  }, [companyId]);

  // =========================
  // FETCH LEADS
  // =========================

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getLeads(companyId, {
        page,
        limit,
        search,
        status: statusFilter,
        priority: priorityFilter,
        leadSource: sourceFilter,
      });

      setLeads(response?.data || []);

      setPagination(
        response?.pagination || {
          total: 0,
          page: 1,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (error) {
      console.error("Lead fetch error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load leads."
      );

      setLeads([]);

      setPagination({
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH COUNSELORS
  // =========================

  const fetchCounselors = async () => {
    try {
      setCounselorLoading(true);

      const data =
        await getCompanyCounselors(companyId);

      setCounselors(data.counselors || []);
    } catch (error) {
      console.error(
        "Counselor fetch error:",
        error
      );
    } finally {
      setCounselorLoading(false);
    }
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // COMMUNICATION CHANGE
  // =========================

  const handleCommunicationChange = (e) => {
    setCommunication({
      ...communication,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // OPEN ADD MODAL
  // =========================

  const openAddModal = () => {
    setEditingLead(null);
    setFormData(initialForm);
    setError("");
    setShowModal(true);
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const openEditModal = (lead) => {
    setEditingLead(lead);

    setFormData({
      fullName: lead.fullName || "",
      contactNumber: lead.contactNumber || "",
      email: lead.email || "",
      city: lead.city || "",
      courseInterested:
        lead.courseInterested || "",
      inquiryType:
        lead.inquiryType || "course",
      leadSource:
        lead.leadSource || "website",
      assignedCounselor:
        lead.assignedCounselor?._id || "",
      priority: lead.priority || "medium",
      status: lead.status || "new",
      nextFollowUpDate: lead.nextFollowUpDate
        ? formatDateForInput(
            lead.nextFollowUpDate
          )
        : "",
      notes: lead.notes || "",
      expectedFees:
        lead.expectedFees ?? "",
      admissionDate: lead.admissionDate
        ? formatDateForInput(
            lead.admissionDate
          )
        : "",
    });

    setError("");
    setShowDetailsModal(false);
    setShowModal(true);
  };

  // =========================
  // CREATE / UPDATE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      const payload = {
        ...formData,
        company: companyId,
      };

      if (!formData.assignedCounselor) {
        payload.assignedCounselor = null;
      }

      if (!formData.expectedFees) {
        payload.expectedFees = null;
      }

      if (!formData.nextFollowUpDate) {
        payload.nextFollowUpDate = null;
      }

      if (!formData.admissionDate) {
        payload.admissionDate = null;
      }

      if (editingLead) {
        await updateLead(
          editingLead._id,
          payload
        );

        setSuccess(
          "Lead updated successfully."
        );
      } else {
        await createLead(payload);

        setSuccess(
          "Lead created successfully."
        );
      }

      setShowModal(false);
      setEditingLead(null);
      setFormData(initialForm);

      // Go back to first page after creating/updating
      setPage(1);

      await fetchLeads();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Lead save error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to save lead."
      );
    }
  };

  // =========================
  // STATUS
  // =========================

  const handleStatusChange = async (
    leadId,
    status
  ) => {
    try {
      setError("");

      const response =
        await updateLeadStatus(
          leadId,
          status
        );

      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead._id === leadId
            ? {
                ...lead,
                status:
                  response?.lead?.status ||
                  status,
              }
            : lead
        )
      );

      if (selectedLead?._id === leadId) {
        setSelectedLead({
          ...selectedLead,
          status,
        });
      }

      setSuccess(
        "Lead status updated successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update status."
      );
    }
  };

  // =========================
  // COMMUNICATION
  // =========================

  const handleAddCommunication = async (
    e
  ) => {
    e.preventDefault();

    if (!communication.message.trim()) {
      return;
    }

    try {
      setError("");

      const response =
        await addCommunication(
          selectedLead._id,
          communication
        );

      setSelectedLead(response.lead);

      setCommunication({
        type: "call",
        message: "",
      });

      await fetchLeads();

      setSuccess(
        "Communication added successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to add communication."
      );
    }
  };

  // =========================
  // CLEAR FILTERS
  // =========================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setSourceFilter("");
    setPage(1);
  };

  // =========================
  // FILTER
  // =========================
  // Backend already performs filtering.
  // This useMemo is only a safety layer for
  // the current page of results.

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) {
      return [];
    }

    return leads.filter((lead) => {
      const searchText =
        search.toLowerCase();

      const matchesSearch =
        lead.fullName
          ?.toLowerCase()
          .includes(searchText) ||
        lead.contactNumber
          ?.toLowerCase()
          .includes(searchText) ||
        lead.email
          ?.toLowerCase()
          .includes(searchText) ||
        lead.city
          ?.toLowerCase()
          .includes(searchText) ||
        lead.courseInterested
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        !statusFilter ||
        lead.status === statusFilter;

      const matchesPriority =
        !priorityFilter ||
        lead.priority === priorityFilter;

      const matchesSource =
        !sourceFilter ||
        lead.leadSource === sourceFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesSource
      );
    });
  }, [
    leads,
    search,
    statusFilter,
    priorityFilter,
    sourceFilter,
  ]);

  // =========================
  // PAGINATION HANDLERS
  // =========================

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      setPage((currentPage) =>
        Math.max(currentPage - 1, 1)
      );
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPage((currentPage) =>
        currentPage + 1
      );
    }
  };

  // =========================
  // HELPERS
  // =========================

  const formatStatus = (value) => {
    if (!value) return "-";

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
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

  const formatDateForInput = (date) => {
    const d = new Date(date);

    const year = d.getFullYear();

    const month = String(
      d.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      d.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getStatusClass = (status) => {
    const classes = {
      new: "status-new",
      contacted: "status-contacted",
      interested: "status-interested",
      follow_up: "status-followup",
      converted: "status-converted",
      not_interested:
        "status-not-interested",
      closed: "status-closed",
    };

    return (
      classes[status] || "status-default"
    );
  };

  const getPriorityClass = (priority) => {
    const classes = {
      low: "priority-low",
      medium: "priority-medium",
      high: "priority-high",
    };

    return classes[priority] || "";
  };

  return (
    <div>

      {/* HEADER */}

      <div className="dashboard-page-header lead-page-header">

        <div>
          <h2>Leads</h2>

          <p>
            Manage and track all company leads
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openAddModal}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Lead
        </button>

      </div>

      {/* ALERTS */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* FILTERS */}

      <div className="lead-filter-card">

        <div className="row g-3">

          <div className="col-12 col-lg-4">

            <div className="input-group">

              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />

            </div>

          </div>

          <div className="col-12 col-sm-4 col-lg-2">

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value
                );
                setPage(1);
              }}
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

          <div className="col-12 col-sm-4 col-lg-2">

            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(
                  e.target.value
                );
                setPage(1);
              }}
            >

              <option value="">
                All Priority
              </option>

              <option value="high">
                High
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="low">
                Low
              </option>

            </select>

          </div>

          <div className="col-12 col-sm-4 col-lg-2">

            <select
              className="form-select"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(
                  e.target.value
                );
                setPage(1);
              }}
            >

              <option value="">
                All Sources
              </option>

              <option value="website">
                Website
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

          <div className="col-12 col-lg-2">

            <button
              className="btn btn-light w-100"
              onClick={clearFilters}
            >
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Clear
            </button>

          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="lead-table-card">

        <div className="lead-table-header">

          <h5>All Leads</h5>

          <span>
            {pagination.total} lead
            {pagination.total !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {loading ? (
          <div className="table-loading">

            <div className="spinner-border text-primary"></div>

            <p>Loading leads...</p>

          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="empty-state">

            <i className="bi bi-people"></i>

            <h5>No leads found</h5>

            <p>
              Add a lead or change your filters.
            </p>

          </div>
        ) : (
          <div className="table-responsive">

            <table className="table align-middle lead-table">

              <thead>

                <tr>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Course</th>
                  <th>Counselor</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Fees</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                {filteredLeads.map((lead) => (

                  <tr key={lead._id}>

                    <td>

                      <div className="lead-name">
                        {lead.fullName}
                      </div>

                      <small>
                        {lead.city || "-"}
                      </small>

                    </td>

                    <td>

                      <div>
                        {lead.contactNumber}
                      </div>

                      <small>
                        {lead.email || "-"}
                      </small>

                    </td>

                    <td>
                      {lead.courseInterested ||
                        "-"}
                    </td>

                    <td>
                      {lead.assignedCounselor
                        ?.fullName || (
                        <span className="text-muted">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td>

                      <span
                        className={`priority-badge ${getPriorityClass(
                          lead.priority
                        )}`}
                      >
                        {formatStatus(
                          lead.priority
                        )}
                      </span>

                    </td>

                    <td>

                      <select
                        className={`status-select ${getStatusClass(
                          lead.status
                        )}`}
                        value={lead.status}
                        onChange={(e) =>
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

                    </td>

                    <td>
                      {formatDate(
                        lead.nextFollowUpDate
                      )}
                    </td>

                    <td>
                      {lead.expectedFees
                        ? `₹${Number(
                            lead.expectedFees
                          ).toLocaleString(
                            "en-IN"
                          )}`
                        : "-"}
                    </td>

                    <td>

                      <div className="d-flex gap-2">

                        <button
                          className="btn btn-sm btn-light"
                          title="View"
                          onClick={() => {
                            setSelectedLead(
                              lead
                            );
                            setShowDetailsModal(
                              true
                            );
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-light"
                          title="Edit"
                          onClick={() =>
                            openEditModal(
                              lead
                            )
                          }
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

        {/* PAGINATION */}

        {!loading &&
          pagination.totalPages > 0 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">

              <div className="text-muted small">
                Showing page{" "}
                <strong>
                  {pagination.page}
                </strong>{" "}
                of{" "}
                <strong>
                  {pagination.totalPages}
                </strong>
              </div>

              <div className="d-flex gap-2">

                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={
                    handlePreviousPage
                  }
                >
                  <i className="bi bi-chevron-left me-1"></i>
                  Previous
                </button>

                <button
                  className="btn btn-sm btn-outline-primary"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={handleNextPage}
                >
                  Next
                  <i className="bi bi-chevron-right ms-1"></i>
                </button>

              </div>

            </div>
          )}

      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div
          className="custom-modal-backdrop"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="custom-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="custom-modal-header">

              <div>

                <h5>
                  {editingLead
                    ? "Edit Lead"
                    : "Add New Lead"}
                </h5>

                <small>
                  {editingLead
                    ? "Update lead information"
                    : "Enter lead information"}
                </small>

              </div>

              <button
                className="btn-close"
                onClick={() =>
                  setShowModal(false)
                }
              ></button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="custom-modal-body">

                <div className="row g-3">

                  <div className="col-md-6">

                    <label className="form-label">
                      Full Name *
                    </label>

                    <input
                      type="text"
                      name="fullName"
                      className="form-control"
                      value={
                        formData.fullName
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Contact Number *
                    </label>

                    <input
                      type="text"
                      name="contactNumber"
                      className="form-control"
                      value={
                        formData.contactNumber
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={
                        formData.email
                      }
                      onChange={
                        handleFormChange
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      value={
                        formData.city
                      }
                      onChange={
                        handleFormChange
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Course Interested
                    </label>

                    <input
                      type="text"
                      name="courseInterested"
                      className="form-control"
                      value={
                        formData.courseInterested
                      }
                      onChange={
                        handleFormChange
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Inquiry Type
                    </label>

                    <select
                      name="inquiryType"
                      className="form-select"
                      value={
                        formData.inquiryType
                      }
                      onChange={
                        handleFormChange
                      }
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

                  <div className="col-md-6">

                    <label className="form-label">
                      Lead Source
                    </label>

                    <select
                      name="leadSource"
                      className="form-select"
                      value={
                        formData.leadSource
                      }
                      onChange={
                        handleFormChange
                      }
                    >

                      <option value="website">
                        Website
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

                  <div className="col-md-6">

                    <label className="form-label">
                      Assigned Counselor
                    </label>

                    <select
                      name="assignedCounselor"
                      className="form-select"
                      value={
                        formData.assignedCounselor
                      }
                      onChange={
                        handleFormChange
                      }
                    >

                      <option value="">
                        {counselorLoading
                          ? "Loading counselors..."
                          : "Unassigned"}
                      </option>

                      {counselors.map(
                        (counselor) => (
                          <option
                            key={
                              counselor._id
                            }
                            value={
                              counselor._id
                            }
                          >
                            {
                              counselor.fullName
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="col-md-4">

                    <label className="form-label">
                      Priority
                    </label>

                    <select
                      name="priority"
                      className="form-select"
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

                  <div className="col-md-4">

                    <label className="form-label">
                      Status
                    </label>

                    <select
                      name="status"
                      className="form-select"
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

                  <div className="col-md-4">

                    <label className="form-label">
                      Expected Fees
                    </label>

                    <input
                      type="number"
                      name="expectedFees"
                      className="form-control"
                      placeholder="₹"
                      min="0"
                      value={
                        formData.expectedFees
                      }
                      onChange={
                        handleFormChange
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Next Follow-up Date
                    </label>

                    <input
                      type="date"
                      name="nextFollowUpDate"
                      className="form-control"
                      value={
                        formData.nextFollowUpDate
                      }
                      onChange={
                        handleFormChange
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Admission Date
                    </label>

                    <input
                      type="date"
                      name="admissionDate"
                      className="form-control"
                      value={
                        formData.admissionDate
                      }
                      onChange={
                        handleFormChange
                      }
                    />

                  </div>

                  <div className="col-12">

                    <label className="form-label">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      className="form-control"
                      rows="4"
                      value={
                        formData.notes
                      }
                      onChange={
                        handleFormChange
                      }
                    ></textarea>

                  </div>

                </div>

              </div>

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >

                  <i
                    className={`bi ${
                      editingLead
                        ? "bi-check-lg"
                        : "bi-plus-lg"
                    } me-2`}
                  ></i>

                  {editingLead
                    ? "Update Lead"
                    : "Create Lead"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* DETAILS MODAL */}

      {showDetailsModal &&
        selectedLead && (
          <div
            className="custom-modal-backdrop"
            onClick={() =>
              setShowDetailsModal(false)
            }
          >

            <div
              className="custom-modal lead-details-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="custom-modal-header">

                <div>

                  <h5>
                    {selectedLead.fullName}
                  </h5>

                  <small>
                    Complete Lead Details
                  </small>

                </div>

                <div className="d-flex gap-2">

                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      openEditModal(
                        selectedLead
                      )
                    }
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>

                  <button
                    className="btn-close"
                    onClick={() =>
                      setShowDetailsModal(
                        false
                      )
                    }
                  ></button>

                </div>

              </div>

              <div className="custom-modal-body">

                <h6 className="detail-section-title">
                  Basic Information
                </h6>

                <div className="lead-detail-grid">

                  <DetailItem
                    label="Full Name"
                    value={
                      selectedLead.fullName
                    }
                  />

                  <DetailItem
                    label="Contact Number"
                    value={
                      selectedLead.contactNumber
                    }
                  />

                  <DetailItem
                    label="Email"
                    value={
                      selectedLead.email || "-"
                    }
                  />

                  <DetailItem
                    label="City"
                    value={
                      selectedLead.city || "-"
                    }
                  />

                </div>

                <h6 className="detail-section-title">
                  Inquiry Information
                </h6>

                <div className="lead-detail-grid">

                  <DetailItem
                    label="Course Interested"
                    value={
                      selectedLead.courseInterested ||
                      "-"
                    }
                  />

                  <DetailItem
                    label="Inquiry Type"
                    value={formatStatus(
                      selectedLead.inquiryType
                    )}
                  />

                  <DetailItem
                    label="Lead Source"
                    value={formatStatus(
                      selectedLead.leadSource
                    )}
                  />

                  <DetailItem
                    label="Assigned Counselor"
                    value={
                      selectedLead
                        .assignedCounselor
                        ?.fullName ||
                      "Unassigned"
                    }
                  />

                </div>

                <h6 className="detail-section-title">
                  Lead Tracking
                </h6>

                <div className="lead-detail-grid">

                  <DetailItem
                    label="Priority"
                    value={formatStatus(
                      selectedLead.priority
                    )}
                  />

                  <DetailItem
                    label="Status"
                    value={formatStatus(
                      selectedLead.status
                    )}
                  />

                  <DetailItem
                    label="Next Follow-up"
                    value={formatDate(
                      selectedLead.nextFollowUpDate
                    )}
                  />

                  <DetailItem
                    label="Expected Fees"
                    value={
                      selectedLead.expectedFees
                        ? `₹${Number(
                            selectedLead.expectedFees
                          ).toLocaleString(
                            "en-IN"
                          )}`
                        : "-"
                    }
                  />

                  <DetailItem
                    label="Admission Date"
                    value={formatDate(
                      selectedLead.admissionDate
                    )}
                  />

                  <DetailItem
                    label="Created Date"
                    value={formatDate(
                      selectedLead.createdAt
                    )}
                  />

                </div>

                <h6 className="detail-section-title">
                  Notes
                </h6>

                <div className="lead-notes">

                  {selectedLead.notes ||
                    "No notes added."}

                </div>

                <hr />

                <h6 className="detail-section-title">
                  Communication History
                </h6>

                {selectedLead.communicationHistory
                  ?.length > 0 ? (
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
                            key={index}
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
                                    : "bi-calendar-event"
                                }`}
                              ></i>

                            </div>

                            <div className="flex-grow-1">

                              <div className="communication-top">

                                <strong>
                                  {formatStatus(
                                    item.type
                                  )}
                                </strong>

                                <small>
                                  {formatDate(
                                    item.date
                                  )}
                                </small>

                              </div>

                              <p>
                                {item.message}
                              </p>

                            </div>

                          </div>
                        )
                      )}

                  </div>
                ) : (
                  <p className="text-muted">
                    No communication history yet.
                  </p>
                )}

                <hr />

                <h6 className="detail-section-title">
                  Add Communication
                </h6>

                <form
                  onSubmit={
                    handleAddCommunication
                  }
                >

                  <div className="row g-3">

                    <div className="col-md-4">

                      <select
                        name="type"
                        className="form-select"
                        value={
                          communication.type
                        }
                        onChange={
                          handleCommunicationChange
                        }
                      >

                        <option value="call">
                          Call
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

                    <div className="col-md-8">

                      <input
                        type="text"
                        name="message"
                        className="form-control"
                        placeholder="Enter communication notes..."
                        value={
                          communication.message
                        }
                        onChange={
                          handleCommunicationChange
                        }
                        required
                      />

                    </div>

                    <div className="col-12">

                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add Communication
                      </button>

                    </div>

                  </div>

                </form>

              </div>

            </div>

          </div>
        )}

    </div>
  );
};

const DetailItem = ({
  label,
  value,
}) => {
  return (
    <div className="lead-detail-item">

      <small>{label}</small>

      <strong>{value}</strong>

    </div>
  );
};

export default Leads;