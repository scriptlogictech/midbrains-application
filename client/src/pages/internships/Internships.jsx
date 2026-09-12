import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import {
  createInternship,
  getCompanyInternships,
  updateInternshipStatus,
} from "../../services/internshipService";

import {
  getCompanyAdmissions,
} from "../../services/admissionService";

import {
  getCompanyUsers,
} from "../../services/userService";

const Internships = () => {
  const { companyId } = useParams();

  // ========================================
  // STATE
  // ========================================

  const [internships, setInternships] =
    useState([]);

  const [admissions, setAdmissions] =
    useState([]);

  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingFormData, setLoadingFormData] =
    useState(false);

  const [submitLoading, setSubmitLoading] =
    useState(false);

  const [statusLoading, setStatusLoading] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [selectedInternship, setSelectedInternship] =
    useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  // ========================================
  // FORM
  // ========================================

  const initialForm = {
    admission: "",
    mentor: "",
    projectTitle: "",
    technology: "",
    duration: "",
    startDate: "",
    endDate: "",
    status: "assigned",
    certificateGenerated: false,
    remarks: "",
  };

  const [formData, setFormData] =
    useState(initialForm);

  // ========================================
  // FETCH INTERNSHIPS
  // ========================================

  const fetchInternships = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await getCompanyInternships(
          companyId
        );

      const internshipData =
        data?.internships ||
        data?.data ||
        data ||
        [];

      setInternships(
        Array.isArray(internshipData)
          ? internshipData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load internships:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load internships."
      );

      setInternships([]);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FETCH ADMISSIONS + USERS
  // ========================================

  const fetchFormData = async () => {
    if (!companyId) return;

    try {
      setLoadingFormData(true);

      const [
        admissionsData,
        usersData,
      ] = await Promise.all([
        getCompanyAdmissions(companyId),
        getCompanyUsers(companyId),
      ]);

      const admissionList =
        admissionsData?.admissions ||
        admissionsData?.data ||
        admissionsData ||
        [];

      const userList =
        usersData?.users ||
        usersData?.data ||
        usersData ||
        [];

      setAdmissions(
        Array.isArray(admissionList)
          ? admissionList
          : []
      );

      // ========================================
      // ONLY ACTIVE EMPLOYEES CAN BE MENTORS
      // ========================================

      const employeeUsers = Array.isArray(
        userList
      )
        ? userList.filter(
            (user) =>
              user.role === "employee" &&
              user.isActive !== false
          )
        : [];

      setUsers(employeeUsers);
    } catch (error) {
      console.error(
        "Failed to load internship form data:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load students or mentors."
      );

      setAdmissions([]);
      setUsers([]);
    } finally {
      setLoadingFormData(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    if (companyId) {
      fetchInternships();
      fetchFormData();
    }
  }, [companyId]);

  // ========================================
  // HANDLE FORM CHANGE
  // ========================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ========================================
  // HANDLE ADMISSION SELECTION
  // ========================================

  const handleAdmissionChange = (e) => {
    const admissionId =
      e.target.value;

    setFormData((prev) => ({
      ...prev,
      admission: admissionId,
    }));
  };

  // ========================================
  // OPEN ADD MODAL
  // ========================================

  const openAddModal = () => {
    setFormData({
      ...initialForm,
      startDate: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setSuccess("");

    setShowModal(true);

    fetchFormData();
  };

  // ========================================
  // CLOSE ADD MODAL
  // ========================================

  const closeModal = () => {
    if (submitLoading) return;

    setShowModal(false);
    setFormData(initialForm);
    setError("");
  };

  // ========================================
  // SUBMIT INTERNSHIP
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!companyId) {
      setError(
        "Company is not selected."
      );

      return;
    }

    if (!formData.admission) {
      setError(
        "Please select a student admission."
      );

      return;
    }

    if (!formData.projectTitle.trim()) {
      setError(
        "Project title is required."
      );

      return;
    }

    if (!formData.startDate) {
      setError(
        "Start date is required."
      );

      return;
    }

    if (!formData.endDate) {
      setError(
        "End date is required."
      );

      return;
    }

    const startDate = new Date(
      formData.startDate
    );

    const endDate = new Date(
      formData.endDate
    );

    if (endDate < startDate) {
      setError(
        "End date cannot be before start date."
      );

      return;
    }

    try {
      setSubmitLoading(true);

      const internshipData = {
        company: companyId,

        admission:
          formData.admission,

        mentor:
          formData.mentor || undefined,

        projectTitle:
          formData.projectTitle.trim(),

        technology:
          formData.technology.trim() ||
          undefined,

        duration:
          formData.duration.trim() ||
          undefined,

        startDate:
          formData.startDate,

        endDate:
          formData.endDate,

        status:
          formData.status,

        certificateGenerated:
          formData.certificateGenerated,

        remarks:
          formData.remarks.trim() ||
          undefined,
      };

      await createInternship(
        internshipData
      );

      setSuccess(
        "Internship created successfully."
      );

      setShowModal(false);

      setFormData(initialForm);

      await fetchInternships();
    } catch (error) {
      console.error(
        "Failed to create internship:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create internship."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ========================================
  // UPDATE STATUS
  // ========================================

  const handleStatusChange = async (
    internshipId,
    status
  ) => {
    try {
      setStatusLoading(internshipId);

      setError("");
      setSuccess("");

      await updateInternshipStatus(
        internshipId,
        status
      );

      setSuccess(
        "Internship status updated successfully."
      );

      await fetchInternships();
    } catch (error) {
      console.error(
        "Failed to update internship status:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update internship status."
      );
    } finally {
      setStatusLoading("");
    }
  };

  // ========================================
  // FILTER INTERNSHIPS
  // ========================================

  const filteredInternships = useMemo(() => {
    return internships.filter(
      (internship) => {
        const searchValue =
          search
            .toLowerCase()
            .trim();

        const studentName =
          internship.admission
            ?.studentName || "";

        const courseName =
          internship.admission
            ?.courseName || "";

        const mentorName =
          internship.mentor
            ?.fullName || "";

        const projectTitle =
          internship.projectTitle || "";

        const technology =
          internship.technology || "";

        const matchesSearch =
          !searchValue ||
          studentName
            .toLowerCase()
            .includes(searchValue) ||
          courseName
            .toLowerCase()
            .includes(searchValue) ||
          mentorName
            .toLowerCase()
            .includes(searchValue) ||
          projectTitle
            .toLowerCase()
            .includes(searchValue) ||
          technology
            .toLowerCase()
            .includes(searchValue);

        const matchesStatus =
          statusFilter === "all" ||
          internship.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    internships,
    search,
    statusFilter,
  ]);

  // ========================================
  // SUMMARY
  // ========================================

  const summary = useMemo(() => {
    const total =
      internships.length;

    const assigned =
      internships.filter(
        (item) =>
          item.status === "assigned"
      ).length;

    const inProgress =
      internships.filter(
        (item) =>
          item.status ===
          "in_progress"
      ).length;

    const completed =
      internships.filter(
        (item) =>
          item.status === "completed"
      ).length;

    const cancelled =
      internships.filter(
        (item) =>
          item.status === "cancelled"
      ).length;

    const certificates =
      internships.filter(
        (item) =>
          item.certificateGenerated
      ).length;

    return {
      total,
      assigned,
      inProgress,
      completed,
      cancelled,
      certificates,
    };
  }, [internships]);

  // ========================================
  // HELPERS
  // ========================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getStatusBadge = (status) => {
    const badgeMap = {
      assigned: "primary",
      in_progress: "warning",
      completed: "success",
      cancelled: "danger",
    };

    return (
      badgeMap[status] ||
      "secondary"
    );
  };

  // ========================================
  // DETAILS
  // ========================================

  const openDetails = (internship) => {
    setSelectedInternship(
      internship
    );

    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setSelectedInternship(null);
    setShowDetailsModal(false);
  };

  // ========================================
  // RESET FILTERS
  // ========================================

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="dashboard-loading">

        <div className="spinner-border text-primary"></div>

        <p className="mt-3 mb-0">
          Loading internships...
        </p>

      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="internships-page">

      {/* ========================================
          PAGE HEADER
      ======================================== */}

      <div className="dashboard-page-header">

        <div>

          <h2 className="fw-bold mb-1">
            Internships
          </h2>

          <p className="text-muted mb-0">
            Manage student internships,
            mentors and projects.
          </p>

        </div>

        <button
          className="btn btn-primary"
          onClick={openAddModal}
        >
          <i className="bi bi-person-workspace me-2"></i>
          Add Internship
        </button>

      </div>

      {/* ========================================
          ALERTS
      ======================================== */}

      {error && !showModal && (
        <div className="alert alert-danger">

          <i className="bi bi-exclamation-triangle me-2"></i>

          {error}

          <button
            type="button"
            className="btn-close float-end"
            onClick={() => setError("")}
          ></button>

        </div>
      )}

      {success && (
        <div className="alert alert-success">

          <i className="bi bi-check-circle me-2"></i>

          {success}

          <button
            type="button"
            className="btn-close float-end"
            onClick={() => setSuccess("")}
          ></button>

        </div>
      )}

      {/* ========================================
          SUMMARY CARDS
      ======================================== */}

      <div className="row g-4 mb-4">

        {/* TOTAL */}

        <div className="col-xl-3 col-md-6">

          <div className="internship-stat-card">

            <div className="internship-stat-icon primary">
              <i className="bi bi-briefcase"></i>
            </div>

            <div>

              <div className="text-muted small">
                Total Internships
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.total}
              </h3>

            </div>

          </div>

        </div>

        {/* IN PROGRESS */}

        <div className="col-xl-3 col-md-6">

          <div className="internship-stat-card">

            <div className="internship-stat-icon warning">
              <i className="bi bi-hourglass-split"></i>
            </div>

            <div>

              <div className="text-muted small">
                In Progress
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.inProgress}
              </h3>

            </div>

          </div>

        </div>

        {/* COMPLETED */}

        <div className="col-xl-3 col-md-6">

          <div className="internship-stat-card">

            <div className="internship-stat-icon success">
              <i className="bi bi-check-circle"></i>
            </div>

            <div>

              <div className="text-muted small">
                Completed
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.completed}
              </h3>

            </div>

          </div>

        </div>

        {/* CERTIFICATES */}

        <div className="col-xl-3 col-md-6">

          <div className="internship-stat-card">

            <div className="internship-stat-icon info">
              <i className="bi bi-award"></i>
            </div>

            <div>

              <div className="text-muted small">
                Certificates
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.certificates}
              </h3>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================
          FILTERS
      ======================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body">

          <div className="row g-3">

            {/* SEARCH */}

            <div className="col-lg-7">

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
                  placeholder="Search student, project, technology or mentor..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
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
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Status
                </option>

                <option value="assigned">
                  Assigned
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

              </select>

            </div>

            {/* RESET */}

            <div className="col-lg-2 d-flex align-items-end">

              <button
                type="button"
                className="btn btn-light border w-100"
                onClick={resetFilters}
              >
                <i className="bi bi-x-circle me-2"></i>
                Reset
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================
          INTERNSHIP TABLE
      ======================================== */}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-0 py-3">

          <div className="d-flex justify-content-between align-items-center">

            <div>

              <h5 className="fw-bold mb-1">
                Internship Records
              </h5>

              <small className="text-muted">
                Showing{" "}
                {filteredInternships.length}{" "}
                of{" "}
                {internships.length}
              </small>

            </div>

            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={fetchInternships}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>

          </div>

        </div>

        <div className="card-body p-0">

          {filteredInternships.length === 0 ? (

            <div className="internship-empty">

              <div className="internship-empty-icon">
                <i className="bi bi-briefcase"></i>
              </div>

              <h5 className="mt-3">
                No internships found
              </h5>

              <p className="text-muted mb-0">
                No internship records match
                your current filters.
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="table align-middle mb-0">

                <thead>

                  <tr>

                    <th>
                      Student
                    </th>

                    <th>
                      Project
                    </th>

                    <th>
                      Technology
                    </th>

                    <th>
                      Mentor
                    </th>

                    <th>
                      Duration
                    </th>

                    <th>
                      Start Date
                    </th>

                    <th>
                      End Date
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Certificate
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredInternships.map(
                    (internship) => (

                      <tr
                        key={
                          internship._id
                        }
                      >

                        {/* STUDENT */}

                        <td>

                          <div className="d-flex align-items-center">

                            <div className="internship-avatar">

                              {(
                                internship
                                  .admission
                                  ?.studentName ||
                                "S"
                              )
                                .charAt(0)
                                .toUpperCase()}

                            </div>

                            <div>

                              <div className="fw-semibold">

                                {
                                  internship
                                    .admission
                                    ?.studentName ||
                                  "-"
                                }

                              </div>

                              <small className="text-muted">

                                {
                                  internship
                                    .admission
                                    ?.courseName ||
                                  "-"
                                }

                              </small>

                            </div>

                          </div>

                        </td>

                        {/* PROJECT */}

                        <td>

                          <div className="fw-semibold">

                            {
                              internship.projectTitle ||
                              "-"
                            }

                          </div>

                        </td>

                        {/* TECHNOLOGY */}

                        <td>
                          {
                            internship.technology ||
                            "-"
                          }
                        </td>

                        {/* MENTOR */}

                        <td>

                          {
                            internship.mentor
                              ?.fullName || (
                              <span className="text-muted">
                                Unassigned
                              </span>
                            )
                          }

                        </td>

                        {/* DURATION */}

                        <td>
                          {
                            internship.duration ||
                            "-"
                          }
                        </td>

                        {/* START */}

                        <td>
                          {formatDate(
                            internship.startDate
                          )}
                        </td>

                        {/* END */}

                        <td>
                          {formatDate(
                            internship.endDate
                          )}
                        </td>

                        {/* STATUS */}

                        <td>

                          <select
                            className={`form-select form-select-sm internship-status-select border-${getStatusBadge(
                              internship.status
                            )}`}
                            value={
                              internship.status
                            }
                            disabled={
                              statusLoading ===
                              internship._id
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                internship._id,
                                e.target.value
                              )
                            }
                          >

                            <option value="assigned">
                              Assigned
                            </option>

                            <option value="in_progress">
                              In Progress
                            </option>

                            <option value="completed">
                              Completed
                            </option>

                            <option value="cancelled">
                              Cancelled
                            </option>

                          </select>

                        </td>

                        {/* CERTIFICATE */}

                        <td>

                          {internship.certificateGenerated ? (

                            <span className="badge bg-success">
                              Generated
                            </span>

                          ) : (

                            <span className="badge bg-secondary">
                              Pending
                            </span>

                          )}

                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              openDetails(
                                internship
                              )
                            }
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* ========================================
          ADD INTERNSHIP MODAL
      ======================================== */}

      {showModal && (

        <div
          className="custom-modal-backdrop"
          onClick={closeModal}
        >

          <div
            className="custom-modal internship-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="custom-modal-header">

              <div>

                <h5 className="mb-1 fw-bold">
                  Add Internship
                </h5>

                <small className="text-muted">
                  Assign an internship to a
                  student.
                </small>

              </div>

              <button
                type="button"
                className="btn-close"
                onClick={closeModal}
                disabled={
                  submitLoading
                }
              ></button>

            </div>

            <form
              onSubmit={handleSubmit}
            >

              <div className="custom-modal-body">

                {/* ERROR */}

                {error && (

                  <div className="alert alert-danger">

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    {error}

                    <button
                      type="button"
                      className="btn-close float-end"
                      onClick={() =>
                        setError("")
                      }
                    ></button>

                  </div>

                )}

                <div className="row g-3">

                  {/* ========================================
                      STUDENT / ADMISSION
                  ======================================== */}

                  <div className="col-12">

                    <label className="form-label">

                      Select Student{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <select
                      name="admission"
                      className="form-select"
                      value={
                        formData.admission
                      }
                      onChange={
                        handleAdmissionChange
                      }
                      disabled={
                        loadingFormData ||
                        submitLoading
                      }
                      required
                    >

                      <option value="">

                        {loadingFormData
                          ? "Loading students..."
                          : admissions.length ===
                            0
                          ? "No admissions available"
                          : "Select student"}

                      </option>

                      {admissions.map(
                        (admission) => (

                          <option
                            key={
                              admission._id
                            }
                            value={
                              admission._id
                            }
                          >

                            {
                              admission.studentName
                            }

                            {" - "}

                            {
                              admission.courseName
                            }

                            {" - Batch: "}

                            {
                              admission.batchName
                            }

                          </option>

                        )
                      )}

                    </select>

                    {!loadingFormData &&
                      admissions.length ===
                        0 && (

                        <small className="text-danger">

                          No admissions found
                          for this company.

                        </small>

                      )}

                    <small className="text-muted">

                      Select the student from
                      the existing admission
                      records.

                    </small>

                  </div>

                  {/* ========================================
                      MENTOR
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Mentor
                    </label>

                    <select
                      name="mentor"
                      className="form-select"
                      value={
                        formData.mentor
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        loadingFormData ||
                        submitLoading
                      }
                    >

                      <option value="">
                        No Mentor Assigned
                      </option>

                      {users.map(
                        (user) => (

                          <option
                            key={
                              user._id
                            }
                            value={
                              user._id
                            }
                          >

                            {
                              user.fullName
                            }

                            {" - Employee"}

                          </option>

                        )
                      )}

                    </select>

                    <small className="text-muted">
                      Only active employees can
                      be assigned as internship
                      mentors.
                    </small>

                  </div>

                  {/* ========================================
                      PROJECT TITLE
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Project Title{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="projectTitle"
                      className="form-control"
                      placeholder="Enter project title"
                      value={
                        formData.projectTitle
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitLoading
                      }
                    />

                  </div>

                  {/* ========================================
                      TECHNOLOGY
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Technology
                    </label>

                    <input
                      type="text"
                      name="technology"
                      className="form-control"
                      placeholder="e.g. MERN Stack"
                      value={
                        formData.technology
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitLoading
                      }
                    />

                  </div>

                  {/* ========================================
                      DURATION
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Duration
                    </label>

                    <input
                      type="text"
                      name="duration"
                      className="form-control"
                      placeholder="e.g. 3 Months"
                      value={
                        formData.duration
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitLoading
                      }
                    />

                  </div>

                  {/* ========================================
                      START DATE
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Start Date{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="date"
                      name="startDate"
                      className="form-control"
                      value={
                        formData.startDate
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitLoading
                      }
                    />

                  </div>

                  {/* ========================================
                      END DATE
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">

                      End Date{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="date"
                      name="endDate"
                      className="form-control"
                      value={
                        formData.endDate
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitLoading
                      }
                    />

                  </div>

                  {/* ========================================
                      STATUS
                  ======================================== */}

                  <div className="col-md-6">

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
                        handleChange
                      }
                      disabled={
                        submitLoading
                      }
                    >

                      <option value="assigned">
                        Assigned
                      </option>

                      <option value="in_progress">
                        In Progress
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>

                    </select>

                  </div>

                  {/* ========================================
                      CERTIFICATE
                  ======================================== */}

                  <div className="col-md-6">

                    <div className="form-check mt-4">

                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="certificateGenerated"
                        name="certificateGenerated"
                        checked={
                          formData.certificateGenerated
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          submitLoading
                        }
                      />

                      <label
                        className="form-check-label"
                        htmlFor="certificateGenerated"
                      >
                        Certificate Generated
                      </label>

                    </div>

                  </div>

                  {/* ========================================
                      REMARKS
                  ======================================== */}

                  <div className="col-12">

                    <label className="form-label">
                      Remarks
                    </label>

                    <textarea
                      name="remarks"
                      className="form-control"
                      rows="3"
                      placeholder="Enter remarks..."
                      value={
                        formData.remarks
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        submitLoading
                      }
                    ></textarea>

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={closeModal}
                  disabled={
                    submitLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    submitLoading ||
                    loadingFormData
                  }
                >

                  {submitLoading ? (

                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>

                  ) : (

                    <>
                      <i className="bi bi-check2-circle me-2"></i>
                      Create Internship
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ========================================
          DETAILS MODAL
      ======================================== */}

      {showDetailsModal &&
        selectedInternship && (

          <div
            className="custom-modal-backdrop"
            onClick={closeDetails}
          >

            <div
              className="custom-modal internship-details-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="custom-modal-header">

                <div>

                  <h5 className="mb-1 fw-bold">
                    Internship Details
                  </h5>

                  <small className="text-muted">
                    Complete internship
                    information
                  </small>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDetails}
                ></button>

              </div>

              {/* BODY */}

              <div className="custom-modal-body">

                {/* STUDENT PROFILE */}

                <div className="internship-detail-profile">

                  <div className="internship-detail-avatar">

                    {(
                      selectedInternship
                        .admission
                        ?.studentName ||
                      "S"
                    )
                      .charAt(0)
                      .toUpperCase()}

                  </div>

                  <div>

                    <h5 className="mb-1">

                      {
                        selectedInternship
                          .admission
                          ?.studentName ||
                        "-"
                      }

                    </h5>

                    <p className="text-muted mb-0">

                      {
                        selectedInternship
                          .projectTitle ||
                        "-"
                      }

                    </p>

                  </div>

                </div>

                {/* STUDENT INFORMATION */}

                <div className="internship-detail-section">

                  <h6>

                    <i className="bi bi-person me-2"></i>

                    Student Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Student
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship
                            .admission
                            ?.studentName ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Contact
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship
                            .admission
                            ?.contactNumber ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Email
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship
                            .admission
                            ?.email ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Course
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship
                            .admission
                            ?.courseName ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Batch
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship
                            .admission
                            ?.batchName ||
                          "-"
                        }

                      </div>

                    </div>

                  </div>

                </div>

                {/* INTERNSHIP INFORMATION */}

                <div className="internship-detail-section">

                  <h6>

                    <i className="bi bi-briefcase me-2"></i>

                    Internship Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Project Title
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship.projectTitle ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Technology
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship.technology ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Duration
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship.duration ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Mentor
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedInternship
                            .mentor
                            ?.fullName ||
                          "Unassigned"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Start Date
                      </small>

                      <div className="fw-semibold">

                        {formatDate(
                          selectedInternship.startDate
                        )}

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        End Date
                      </small>

                      <div className="fw-semibold">

                        {formatDate(
                          selectedInternship.endDate
                        )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* STATUS */}

                <div className="internship-detail-section">

                  <h6>

                    <i className="bi bi-bar-chart me-2"></i>

                    Status

                  </h6>

                  <div>

                    <span
                      className={`badge bg-${getStatusBadge(
                        selectedInternship.status
                      )}`}
                    >

                      {formatStatus(
                        selectedInternship.status
                      )}

                    </span>

                  </div>

                </div>

                {/* CERTIFICATE */}

                <div className="internship-detail-section">

                  <h6>

                    <i className="bi bi-award me-2"></i>

                    Certificate

                  </h6>

                  <div>

                    {selectedInternship.certificateGenerated ? (

                      <span className="badge bg-success">
                        Certificate Generated
                      </span>

                    ) : (

                      <span className="badge bg-secondary">
                        Certificate Pending
                      </span>

                    )}

                  </div>

                </div>

                {/* REMARKS */}

                <div className="internship-detail-section">

                  <h6>

                    <i className="bi bi-chat-left-text me-2"></i>

                    Remarks

                  </h6>

                  <p className="text-muted mb-0">

                    {
                      selectedInternship.remarks ||
                      "No remarks added."
                    }

                  </p>

                </div>

              </div>

              {/* FOOTER */}

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={closeDetails}
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
};

export default Internships;