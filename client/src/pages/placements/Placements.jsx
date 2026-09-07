import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import {
  createPlacement,
  getCompanyPlacements,
  updatePlacementStatus,
} from "../../services/placementService";

import { getCompanyAdmissions } from "../../services/admissionService";

const Placements = () => {
  const { companyId } = useParams();

  // ========================================
  // STATE
  // ========================================

  const [placements, setPlacements] = useState([]);
  const [admissions, setAdmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingAdmissions, setLoadingAdmissions] =
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

  const [selectedPlacement, setSelectedPlacement] =
    useState(null);

  const [search, setSearch] = useState("");

  const [interviewFilter, setInterviewFilter] =
    useState("all");

  const [joiningFilter, setJoiningFilter] =
    useState("all");

  // ========================================
  // FORM
  // ========================================

  const initialForm = {
    admission: "",
    hiringCompany: "",
    jobRole: "",
    package: "",
    interviewDate: "",
    hrName: "",
    hrContact: "",
    interviewStatus: "scheduled",
    joiningDate: "",
    joiningStatus: "not_joined",
    offerLetter: "",
    remarks: "",
  };

  const [formData, setFormData] =
    useState(initialForm);

  // ========================================
  // FETCH PLACEMENTS
  // ========================================

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getCompanyPlacements(companyId);

      setPlacements(
        data?.placements ||
          data?.data ||
          data ||
          []
      );
    } catch (error) {
      console.error(
        "Failed to load placements:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load placements."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FETCH ADMISSIONS
  // ========================================

  const fetchAdmissions = async () => {
    try {
      setLoadingAdmissions(true);

      const data =
        await getCompanyAdmissions(companyId);

      setAdmissions(
        data?.admissions ||
          data?.data ||
          data ||
          []
      );
    } catch (error) {
      console.error(
        "Failed to load admissions:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load students."
      );
    } finally {
      setLoadingAdmissions(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    if (companyId) {
      fetchPlacements();
      fetchAdmissions();
    }
  }, [companyId]);

  // ========================================
  // HANDLE CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // OPEN ADD MODAL
  // ========================================

  const openAddModal = () => {
    setFormData(initialForm);

    setError("");
    setSuccess("");

    setShowModal(true);

    fetchAdmissions();
  };

  // ========================================
  // CLOSE MODAL
  // ========================================

  const closeModal = () => {
    if (submitLoading) return;

    setShowModal(false);
    setFormData(initialForm);
    setError("");
  };

  // ========================================
  // SUBMIT PLACEMENT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.admission ||
      !formData.hiringCompany.trim() ||
      !formData.jobRole.trim()
    ) {
      setError(
        "Student, hiring company and job role are required."
      );

      return;
    }

    const packageAmount =
      Number(formData.package) || 0;

    if (packageAmount < 0) {
      setError(
        "Package cannot be negative."
      );

      return;
    }

    try {
      setSubmitLoading(true);

      const placementData = {
        company: companyId,

        admission:
          formData.admission,

        hiringCompany:
          formData.hiringCompany.trim(),

        jobRole:
          formData.jobRole.trim(),

        package:
          packageAmount,

        interviewDate:
          formData.interviewDate ||
          undefined,

        hrName:
          formData.hrName.trim() ||
          undefined,

        hrContact:
          formData.hrContact.trim() ||
          undefined,

        interviewStatus:
          formData.interviewStatus,

        joiningDate:
          formData.joiningDate ||
          undefined,

        joiningStatus:
          formData.joiningStatus,

        offerLetter:
          formData.offerLetter.trim() ||
          undefined,

        remarks:
          formData.remarks.trim() ||
          undefined,
      };

      await createPlacement(
        placementData
      );

      setSuccess(
        "Placement record created successfully."
      );

      setShowModal(false);
      setFormData(initialForm);

      await fetchPlacements();
    } catch (error) {
      console.error(
        "Failed to create placement:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create placement."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ========================================
  // UPDATE STATUS
  // ========================================

  const handleStatusChange = async (
    placementId,
    field,
    value
  ) => {
    try {
      setStatusLoading(
        `${placementId}-${field}`
      );

      setError("");
      setSuccess("");

      await updatePlacementStatus(
        placementId,
        {
          [field]: value,
        }
      );

      setSuccess(
        "Placement status updated successfully."
      );

      await fetchPlacements();
    } catch (error) {
      console.error(
        "Failed to update placement:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update placement status."
      );
    } finally {
      setStatusLoading("");
    }
  };

  // ========================================
  // SEARCH & FILTER
  // ========================================

  const filteredPlacements = useMemo(() => {
    return placements.filter(
      (placement) => {
        const searchValue =
          search.toLowerCase().trim();

        const studentName =
          placement.admission
            ?.studentName || "";

        const contactNumber =
          placement.admission
            ?.contactNumber || "";

        const courseName =
          placement.admission
            ?.courseName || "";

        const matchesSearch =
          !searchValue ||
          studentName
            .toLowerCase()
            .includes(searchValue) ||
          contactNumber
            .toLowerCase()
            .includes(searchValue) ||
          courseName
            .toLowerCase()
            .includes(searchValue) ||
          placement.hiringCompany
            ?.toLowerCase()
            .includes(searchValue) ||
          placement.jobRole
            ?.toLowerCase()
            .includes(searchValue) ||
          placement.hrName
            ?.toLowerCase()
            .includes(searchValue);

        const matchesInterview =
          interviewFilter === "all" ||
          placement.interviewStatus ===
            interviewFilter;

        const matchesJoining =
          joiningFilter === "all" ||
          placement.joiningStatus ===
            joiningFilter;

        return (
          matchesSearch &&
          matchesInterview &&
          matchesJoining
        );
      }
    );
  }, [
    placements,
    search,
    interviewFilter,
    joiningFilter,
  ]);

  // ========================================
  // SUMMARY
  // ========================================

  const summary = useMemo(() => {
    const total = placements.length;

    const scheduled = placements.filter(
      (item) =>
        item.interviewStatus ===
        "scheduled"
    ).length;

    const selected = placements.filter(
      (item) =>
        item.interviewStatus ===
        "selected"
    ).length;

    const rejected = placements.filter(
      (item) =>
        item.interviewStatus ===
        "rejected"
    ).length;

    const pending = placements.filter(
      (item) =>
        item.interviewStatus ===
        "pending"
    ).length;

    const joined = placements.filter(
      (item) =>
        item.joiningStatus ===
        "joined"
    ).length;

    const notJoined = placements.filter(
      (item) =>
        item.joiningStatus ===
        "not_joined"
    ).length;

    const totalPackage = placements.reduce(
      (total, item) =>
        total +
        (Number(item.package) || 0),
      0
    );

    return {
      total,
      scheduled,
      selected,
      rejected,
      pending,
      joined,
      notJoined,
      totalPackage,
    };
  }, [placements]);

  // ========================================
  // HELPERS
  // ========================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

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

  const formatPackage = (value) => {
    const amount = Number(value) || 0;

    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(
        2
      )} LPA`;
    }

    return formatCurrency(amount);
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getInterviewBadge = (
    status
  ) => {
    const badgeMap = {
      scheduled: "primary",
      selected: "success",
      rejected: "danger",
      pending: "warning",
    };

    return (
      badgeMap[status] ||
      "secondary"
    );
  };

  const getJoiningBadge = (
    status
  ) => {
    const badgeMap = {
      joined: "success",
      not_joined: "secondary",
    };

    return (
      badgeMap[status] ||
      "secondary"
    );
  };

  // ========================================
  // DETAILS
  // ========================================

  const openDetails = (placement) => {
    setSelectedPlacement(placement);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setSelectedPlacement(null);
    setShowDetailsModal(false);
  };

  // ========================================
  // RESET FILTERS
  // ========================================

  const resetFilters = () => {
    setSearch("");
    setInterviewFilter("all");
    setJoiningFilter("all");
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="dashboard-loading">

        <div className="spinner-border text-primary"></div>

        <p className="mt-3 mb-0">
          Loading placements...
        </p>

      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="placements-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="dashboard-page-header">

        <div>

          <h2 className="fw-bold mb-1">
            Placements
          </h2>

          <p className="text-muted mb-0">
            Manage student placements,
            interviews, companies and joining
            details.
          </p>

        </div>

        <button
          className="btn btn-primary"
          onClick={openAddModal}
        >

          <i className="bi bi-person-check me-2"></i>

          Add Placement

        </button>

      </div>

      {/* ========================================
          ALERTS
      ======================================== */}

      {error && !showModal && (
        <div className="alert alert-danger">

          <i className="bi bi-exclamation-triangle me-2"></i>

          {error}

        </div>
      )}

      {success && (
        <div className="alert alert-success">

          <i className="bi bi-check-circle me-2"></i>

          {success}

        </div>
      )}

      {/* ========================================
          SUMMARY CARDS
      ======================================== */}

      <div className="row g-4 mb-4">

        <div className="col-xl-3 col-md-6">

          <div className="placement-stat-card">

            <div className="placement-stat-icon primary">

              <i className="bi bi-people"></i>

            </div>

            <div>

              <div className="text-muted small">
                Total Placements
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.total}
              </h3>

            </div>

          </div>

        </div>

        <div className="col-xl-3 col-md-6">

          <div className="placement-stat-card">

            <div className="placement-stat-icon success">

              <i className="bi bi-person-check"></i>

            </div>

            <div>

              <div className="text-muted small">
                Selected
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.selected}
              </h3>

            </div>

          </div>

        </div>

        <div className="col-xl-3 col-md-6">

          <div className="placement-stat-card">

            <div className="placement-stat-icon info">

              <i className="bi bi-briefcase"></i>

            </div>

            <div>

              <div className="text-muted small">
                Joined
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.joined}
              </h3>

            </div>

          </div>

        </div>

        <div className="col-xl-3 col-md-6">

          <div className="placement-stat-card">

            <div className="placement-stat-icon warning">

              <i className="bi bi-currency-rupee"></i>

            </div>

            <div>

              <div className="text-muted small">
                Total Package Value
              </div>

              <h3 className="mb-0 fw-bold">
                {formatCurrency(
                  summary.totalPackage
                )}
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
                  placeholder="Search student, company, job role or HR..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

            <div className="col-lg-3">

              <label className="form-label">
                Interview Status
              </label>

              <select
                className="form-select"
                value={interviewFilter}
                onChange={(e) =>
                  setInterviewFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All Status
                </option>

                <option value="scheduled">
                  Scheduled
                </option>

                <option value="selected">
                  Selected
                </option>

                <option value="rejected">
                  Rejected
                </option>

                <option value="pending">
                  Pending
                </option>

              </select>

            </div>

            <div className="col-lg-2">

              <label className="form-label">
                Joining
              </label>

              <select
                className="form-select"
                value={joiningFilter}
                onChange={(e) =>
                  setJoiningFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All
                </option>

                <option value="joined">
                  Joined
                </option>

                <option value="not_joined">
                  Not Joined
                </option>

              </select>

            </div>

            <div className="col-lg-2 d-flex align-items-end">

              <button
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
          TABLE
      ======================================== */}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-0 py-3">

          <div className="d-flex justify-content-between align-items-center">

            <div>

              <h5 className="fw-bold mb-1">
                Placement Records
              </h5>

              <small className="text-muted">

                Showing{" "}
                {filteredPlacements.length}{" "}
                of{" "}
                {placements.length}

              </small>

            </div>

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={fetchPlacements}
            >

              <i className="bi bi-arrow-clockwise me-1"></i>

              Refresh

            </button>

          </div>

        </div>

        <div className="card-body p-0">

          {filteredPlacements.length === 0 ? (

            <div className="placement-empty">

              <div className="placement-empty-icon">

                <i className="bi bi-person-x"></i>

              </div>

              <h5 className="mt-3">
                No placement records found
              </h5>

              <p className="text-muted mb-0">
                No records match your current
                filters.
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="table align-middle mb-0">

                <thead>

                  <tr>

                    <th>Student</th>
                    <th>Hiring Company</th>
                    <th>Job Role</th>
                    <th>Package</th>
                    <th>Interview Date</th>
                    <th>Interview Status</th>
                    <th>Joining Date</th>
                    <th>Joining</th>
                    <th>Action</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredPlacements.map(
                    (placement) => (

                      <tr
                        key={
                          placement._id
                        }
                      >

                        {/* STUDENT */}

                        <td>

                          <div className="d-flex align-items-center">

                            <div className="placement-avatar">

                              {(
                                placement
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
                                  placement
                                    .admission
                                    ?.studentName ||
                                  "-"
                                }

                              </div>

                              <small className="text-muted">

                                {
                                  placement
                                    .admission
                                    ?.courseName ||
                                  "-"
                                }

                              </small>

                            </div>

                          </div>

                        </td>

                        {/* COMPANY */}

                        <td className="fw-semibold">

                          {
                            placement.hiringCompany ||
                            "-"
                          }

                        </td>

                        {/* JOB ROLE */}

                        <td>

                          {
                            placement.jobRole ||
                            "-"
                          }

                        </td>

                        {/* PACKAGE */}

                        <td className="fw-semibold">

                          {formatPackage(
                            placement.package
                          )}

                        </td>

                        {/* INTERVIEW DATE */}

                        <td>

                          {formatDate(
                            placement.interviewDate
                          )}

                        </td>

                        {/* INTERVIEW STATUS */}

                        <td>

                          <select
                            className="form-select form-select-sm placement-status-select"
                            value={
                              placement.interviewStatus
                            }
                            disabled={
                              statusLoading ===
                              `${placement._id}-interviewStatus`
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                placement._id,
                                "interviewStatus",
                                e.target.value
                              )
                            }
                          >

                            <option value="scheduled">
                              Scheduled
                            </option>

                            <option value="selected">
                              Selected
                            </option>

                            <option value="rejected">
                              Rejected
                            </option>

                            <option value="pending">
                              Pending
                            </option>

                          </select>

                        </td>

                        {/* JOINING DATE */}

                        <td>

                          {formatDate(
                            placement.joiningDate
                          )}

                        </td>

                        {/* JOINING STATUS */}

                        <td>

                          <select
                            className="form-select form-select-sm placement-joining-select"
                            value={
                              placement.joiningStatus
                            }
                            disabled={
                              statusLoading ===
                              `${placement._id}-joiningStatus`
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                placement._id,
                                "joiningStatus",
                                e.target.value
                              )
                            }
                          >

                            <option value="not_joined">
                              Not Joined
                            </option>

                            <option value="joined">
                              Joined
                            </option>

                          </select>

                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              openDetails(
                                placement
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
          ADD PLACEMENT MODAL
      ======================================== */}

      {showModal && (

        <div
          className="custom-modal-backdrop"
          onClick={closeModal}
        >

          <div
            className="custom-modal placement-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="custom-modal-header">

              <div>

                <h5 className="mb-1 fw-bold">
                  Add Placement
                </h5>

                <small className="text-muted">
                  Create a new placement record.
                </small>

              </div>

              <button
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

                {error && (

                  <div className="alert alert-danger">

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    {error}

                  </div>

                )}

                <div className="row g-3">

                  {/* STUDENT */}

                  <div className="col-12">

                    <label className="form-label">

                      Student{" "}

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
                        handleChange
                      }
                      disabled={
                        loadingAdmissions
                      }
                    >

                      <option value="">

                        {loadingAdmissions
                          ? "Loading students..."
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

                            {" - "}

                            {
                              admission.contactNumber
                            }

                          </option>

                        )
                      )}

                    </select>

                  </div>

                  {/* HIRING COMPANY */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Hiring Company{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="hiringCompany"
                      className="form-control"
                      placeholder="Enter hiring company"
                      value={
                        formData.hiringCompany
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* JOB ROLE */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Job Role{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="jobRole"
                      className="form-control"
                      placeholder="e.g. Frontend Developer"
                      value={
                        formData.jobRole
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* PACKAGE */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Package
                    </label>

                    <div className="input-group">

                      <span className="input-group-text">
                        ₹
                      </span>

                      <input
                        type="number"
                        name="package"
                        className="form-control"
                        min="0"
                        placeholder="Enter package"
                        value={
                          formData.package
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>

                    <small className="text-muted">
                      Enter annual package amount.
                    </small>

                  </div>

                  {/* INTERVIEW DATE */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Interview Date
                    </label>

                    <input
                      type="date"
                      name="interviewDate"
                      className="form-control"
                      value={
                        formData.interviewDate
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* HR NAME */}

                  <div className="col-md-6">

                    <label className="form-label">
                      HR Name
                    </label>

                    <input
                      type="text"
                      name="hrName"
                      className="form-control"
                      placeholder="Enter HR name"
                      value={
                        formData.hrName
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* HR CONTACT */}

                  <div className="col-md-6">

                    <label className="form-label">
                      HR Contact
                    </label>

                    <input
                      type="tel"
                      name="hrContact"
                      className="form-control"
                      placeholder="Enter HR contact"
                      value={
                        formData.hrContact
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* INTERVIEW STATUS */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Interview Status
                    </label>

                    <select
                      name="interviewStatus"
                      className="form-select"
                      value={
                        formData.interviewStatus
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="scheduled">
                        Scheduled
                      </option>

                      <option value="selected">
                        Selected
                      </option>

                      <option value="rejected">
                        Rejected
                      </option>

                      <option value="pending">
                        Pending
                      </option>

                    </select>

                  </div>

                  {/* JOINING DATE */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Joining Date
                    </label>

                    <input
                      type="date"
                      name="joiningDate"
                      className="form-control"
                      value={
                        formData.joiningDate
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* JOINING STATUS */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Joining Status
                    </label>

                    <select
                      name="joiningStatus"
                      className="form-select"
                      value={
                        formData.joiningStatus
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="not_joined">
                        Not Joined
                      </option>

                      <option value="joined">
                        Joined
                      </option>

                    </select>

                  </div>

                  {/* OFFER LETTER */}

                  <div className="col-12">

                    <label className="form-label">
                      Offer Letter
                    </label>

                    <input
                      type="text"
                      name="offerLetter"
                      className="form-control"
                      placeholder="Enter offer letter URL/path"
                      value={
                        formData.offerLetter
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <small className="text-muted">
                      File upload integration will be
                      connected later.
                    </small>

                  </div>

                  {/* REMARKS */}

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
                    ></textarea>

                  </div>

                </div>

              </div>

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
                    loadingAdmissions
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
                      Create Placement
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
        selectedPlacement && (

          <div
            className="custom-modal-backdrop"
            onClick={closeDetails}
          >

            <div
              className="custom-modal placement-details-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="custom-modal-header">

                <div>

                  <h5 className="mb-1 fw-bold">
                    Placement Details
                  </h5>

                  <small className="text-muted">
                    Complete placement information
                  </small>

                </div>

                <button
                  className="btn-close"
                  onClick={closeDetails}
                ></button>

              </div>

              <div className="custom-modal-body">

                {/* STUDENT PROFILE */}

                <div className="placement-detail-profile">

                  <div className="placement-detail-avatar">

                    {(
                      selectedPlacement
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
                        selectedPlacement
                          .admission
                          ?.studentName ||
                        "-"
                      }

                    </h5>

                    <p className="text-muted mb-0">

                      {
                        selectedPlacement
                          .admission
                          ?.courseName ||
                        "-"
                      }

                    </p>

                  </div>

                </div>

                {/* STUDENT INFORMATION */}

                <div className="placement-detail-section">

                  <h6>

                    <i className="bi bi-person me-2"></i>

                    Student Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Student Name
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedPlacement
                            .admission
                            ?.studentName ||
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
                          selectedPlacement
                            .admission
                            ?.courseName ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Contact Number
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedPlacement
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
                          selectedPlacement
                            .admission
                            ?.email ||
                          "-"
                        }

                      </div>

                    </div>

                  </div>

                </div>

                {/* JOB INFORMATION */}

                <div className="placement-detail-section">

                  <h6>

                    <i className="bi bi-briefcase me-2"></i>

                    Job Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Hiring Company
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedPlacement.hiringCompany ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Job Role
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedPlacement.jobRole ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Package
                      </small>

                      <div className="fw-bold">

                        {formatPackage(
                          selectedPlacement.package
                        )}

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Interview Date
                      </small>

                      <div className="fw-semibold">

                        {formatDate(
                          selectedPlacement.interviewDate
                        )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* HR INFORMATION */}

                <div className="placement-detail-section">

                  <h6>

                    <i className="bi bi-person-badge me-2"></i>

                    HR Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        HR Name
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedPlacement.hrName ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        HR Contact
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedPlacement.hrContact ||
                          "-"
                        }

                      </div>

                    </div>

                  </div>

                </div>

                {/* STATUS */}

                <div className="placement-detail-section">

                  <h6>

                    <i className="bi bi-bar-chart me-2"></i>

                    Placement Status

                  </h6>

                  <div className="d-flex gap-2 flex-wrap">

                    <span
                      className={`badge bg-${getInterviewBadge(
                        selectedPlacement.interviewStatus
                      )}`}
                    >

                      Interview:{" "}

                      {formatStatus(
                        selectedPlacement.interviewStatus
                      )}

                    </span>

                    <span
                      className={`badge bg-${getJoiningBadge(
                        selectedPlacement.joiningStatus
                      )}`}
                    >

                      Joining:{" "}

                      {formatStatus(
                        selectedPlacement.joiningStatus
                      )}

                    </span>

                  </div>

                </div>

                {/* JOINING */}

                <div className="placement-detail-section">

                  <h6>

                    <i className="bi bi-calendar-check me-2"></i>

                    Joining Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Joining Date
                      </small>

                      <div className="fw-semibold">

                        {formatDate(
                          selectedPlacement.joiningDate
                        )}

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Joining Status
                      </small>

                      <div className="fw-semibold">

                        {formatStatus(
                          selectedPlacement.joiningStatus
                        )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* OFFER LETTER */}

                <div className="placement-detail-section">

                  <h6>

                    <i className="bi bi-file-earmark-text me-2"></i>

                    Offer Letter

                  </h6>

                  <p className="text-muted mb-0">

                    {
                      selectedPlacement.offerLetter ||
                      "No offer letter added."
                    }

                  </p>

                </div>

                {/* REMARKS */}

                <div className="placement-detail-section">

                  <h6>

                    <i className="bi bi-chat-left-text me-2"></i>

                    Remarks

                  </h6>

                  <p className="text-muted mb-0">

                    {
                      selectedPlacement.remarks ||
                      "No remarks added."
                    }

                  </p>

                </div>

              </div>

              <div className="custom-modal-footer">

                <button
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

export default Placements;