import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import {
  createCorporateTraining,
  getCompanyCorporateTrainings,
  updateTrainingStatus,
} from "../../services/corporateTrainingService";

import { getCompanyUsers } from "../../services/userService";

const CorporateTraining = () => {
  const { companyId } = useParams();

  // ========================================
  // STATE
  // ========================================

  const [trainings, setTrainings] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] =
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

  const [selectedTraining, setSelectedTraining] =
    useState(null);

  const [search, setSearch] = useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  // ========================================
  // FORM
  // ========================================

  const initialForm = {
    clientCompanyName: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    trainingTopic: "",
    technology: "",
    employeeCount: "",
    trainer: "",
    startDate: "",
    endDate: "",
    paymentAmount: "",
    paymentStatus: "pending",
    trainingStatus: "scheduled",
    remarks: "",
  };

  const [formData, setFormData] =
    useState(initialForm);

  // ========================================
  // FETCH TRAININGS
  // ========================================

  const fetchTrainings = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError("");

      const data =
        await getCompanyCorporateTrainings(
          companyId
        );

      setTrainings(
        data?.trainings ||
          data?.data ||
          data ||
          []
      );
    } catch (error) {
      console.error(
        "Failed to load corporate trainings:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load corporate trainings."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FETCH COMPANY USERS
  // ========================================

  const fetchUsers = async () => {
    if (!companyId) return;

    try {
      setLoadingUsers(true);

      const data =
        await getCompanyUsers(companyId);

      const companyUsers =
        data?.users ||
        data?.data ||
        data ||
        [];

      /*
       * Only active Employees can be trainers.
       *
       * Roles available in the system:
       * super_admin
       * employee
       * intern
       *
       * Super Admin and Intern are NOT trainers.
       */

      const employeeUsers = Array.isArray(
        companyUsers
      )
        ? companyUsers.filter(
            (user) =>
              user.role === "employee" &&
              user.isActive !== false
          )
        : [];

      setUsers(employeeUsers);
    } catch (error) {
      console.error(
        "Failed to load company users:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load trainers."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    if (companyId) {
      fetchTrainings();
      fetchUsers();
    }
  }, [companyId]);

  // ========================================
  // HANDLE FORM CHANGE
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
    setFormData({
      ...initialForm,
      startDate: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setSuccess("");

    setShowModal(true);

    fetchUsers();
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
  // SUBMIT TRAINING
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.clientCompanyName.trim() ||
      !formData.contactPerson.trim() ||
      !formData.contactNumber.trim() ||
      !formData.trainingTopic.trim() ||
      !formData.employeeCount ||
      !formData.startDate ||
      !formData.endDate
    ) {
      setError(
        "Client company, contact person, contact number, training topic, employee count, start date and end date are required."
      );

      return;
    }

    const employeeCount = Number(
      formData.employeeCount
    );

    const paymentAmount =
      Number(formData.paymentAmount) || 0;

    if (employeeCount <= 0) {
      setError(
        "Employee count must be greater than 0."
      );

      return;
    }

    if (paymentAmount < 0) {
      setError(
        "Payment amount cannot be negative."
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

      const trainingData = {
        company: companyId,

        clientCompanyName:
          formData.clientCompanyName.trim(),

        contactPerson:
          formData.contactPerson.trim(),

        contactNumber:
          formData.contactNumber.trim(),

        email:
          formData.email.trim() ||
          undefined,

        trainingTopic:
          formData.trainingTopic.trim(),

        technology:
          formData.technology.trim() ||
          undefined,

        employeeCount,

        trainer:
          formData.trainer || undefined,

        startDate:
          formData.startDate,

        endDate:
          formData.endDate,

        paymentAmount,

        paymentStatus:
          formData.paymentStatus,

        trainingStatus:
          formData.trainingStatus,

        remarks:
          formData.remarks.trim() ||
          undefined,
      };

      await createCorporateTraining(
        trainingData
      );

      setSuccess(
        "Corporate training created successfully."
      );

      setShowModal(false);
      setFormData(initialForm);

      await fetchTrainings();
    } catch (error) {
      console.error(
        "Failed to create corporate training:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create corporate training."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ========================================
  // UPDATE STATUS
  // ========================================

  const handleStatusChange = async (
    trainingId,
    trainingStatus
  ) => {
    try {
      setStatusLoading(trainingId);

      setError("");
      setSuccess("");

      await updateTrainingStatus(
        trainingId,
        trainingStatus
      );

      setSuccess(
        "Training status updated successfully."
      );

      await fetchTrainings();
    } catch (error) {
      console.error(
        "Failed to update training status:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update training status."
      );
    } finally {
      setStatusLoading("");
    }
  };

  // ========================================
  // FILTER
  // ========================================

  const filteredTrainings = useMemo(() => {
    return trainings.filter((training) => {
      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        training.clientCompanyName
          ?.toLowerCase()
          .includes(searchValue) ||
        training.contactPerson
          ?.toLowerCase()
          .includes(searchValue) ||
        training.contactNumber
          ?.toLowerCase()
          .includes(searchValue) ||
        training.email
          ?.toLowerCase()
          .includes(searchValue) ||
        training.trainingTopic
          ?.toLowerCase()
          .includes(searchValue) ||
        training.technology
          ?.toLowerCase()
          .includes(searchValue) ||
        training.trainer?.fullName
          ?.toLowerCase()
          .includes(searchValue);

      const matchesPayment =
        paymentFilter === "all" ||
        training.paymentStatus ===
          paymentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        training.trainingStatus ===
          statusFilter;

      return (
        matchesSearch &&
        matchesPayment &&
        matchesStatus
      );
    });
  }, [
    trainings,
    search,
    paymentFilter,
    statusFilter,
  ]);

  // ========================================
  // SUMMARY
  // ========================================

  const summary = useMemo(() => {
    const total = trainings.length;

    const scheduled =
      trainings.filter(
        (item) =>
          item.trainingStatus ===
          "scheduled"
      ).length;

    const ongoing =
      trainings.filter(
        (item) =>
          item.trainingStatus ===
          "ongoing"
      ).length;

    const completed =
      trainings.filter(
        (item) =>
          item.trainingStatus ===
          "completed"
      ).length;

    const totalRevenue =
      trainings.reduce(
        (total, item) =>
          total +
          (Number(
            item.paymentAmount
          ) || 0),
        0
      );

    const paid =
      trainings.filter(
        (item) =>
          item.paymentStatus ===
          "paid"
      ).length;

    const pending =
      trainings.filter(
        (item) =>
          item.paymentStatus ===
          "pending"
      ).length;

    return {
      total,
      scheduled,
      ongoing,
      completed,
      totalRevenue,
      paid,
      pending,
    };
  }, [trainings]);

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

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getTrainingStatusBadge = (
    status
  ) => {
    const badgeMap = {
      scheduled: "primary",
      ongoing: "warning",
      completed: "success",
      cancelled: "danger",
    };

    return (
      badgeMap[status] ||
      "secondary"
    );
  };

  const getPaymentBadge = (status) => {
    const badgeMap = {
      pending: "danger",
      partial: "warning",
      paid: "success",
    };

    return (
      badgeMap[status] ||
      "secondary"
    );
  };

  // ========================================
  // DETAILS
  // ========================================

  const openDetails = (training) => {
    setSelectedTraining(training);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setSelectedTraining(null);
    setShowDetailsModal(false);
  };

  // ========================================
  // RESET FILTERS
  // ========================================

  const resetFilters = () => {
    setSearch("");
    setPaymentFilter("all");
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
          Loading corporate trainings...
        </p>

      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="corporate-training-page">

      {/* ========================================
          PAGE HEADER
      ======================================== */}

      <div className="dashboard-page-header">

        <div>

          <h2 className="fw-bold mb-1">
            Corporate Training
          </h2>

          <p className="text-muted mb-0">
            Manage corporate clients,
            training programs and payments.
          </p>

        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddModal}
        >
          <i className="bi bi-building-add me-2"></i>
          Add Training
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

        {/* TOTAL */}

        <div className="col-xl-3 col-md-6">

          <div className="corporate-stat-card">

            <div className="corporate-stat-icon primary">
              <i className="bi bi-building"></i>
            </div>

            <div>

              <div className="text-muted small">
                Total Trainings
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.total}
              </h3>

            </div>

          </div>

        </div>

        {/* ONGOING */}

        <div className="col-xl-3 col-md-6">

          <div className="corporate-stat-card">

            <div className="corporate-stat-icon warning">
              <i className="bi bi-play-circle"></i>
            </div>

            <div>

              <div className="text-muted small">
                Ongoing
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.ongoing}
              </h3>

            </div>

          </div>

        </div>

        {/* COMPLETED */}

        <div className="col-xl-3 col-md-6">

          <div className="corporate-stat-card">

            <div className="corporate-stat-icon success">
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

        {/* REVENUE */}

        <div className="col-xl-3 col-md-6">

          <div className="corporate-stat-card">

            <div className="corporate-stat-icon info">
              <i className="bi bi-currency-rupee"></i>
            </div>

            <div>

              <div className="text-muted small">
                Total Revenue
              </div>

              <h3 className="mb-0 fw-bold">
                {formatCurrency(
                  summary.totalRevenue
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
                  placeholder="Search client, contact, topic, technology or trainer..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* PAYMENT */}

            <div className="col-lg-2">

              <label className="form-label">
                Payment
              </label>

              <select
                className="form-select"
                value={paymentFilter}
                onChange={(e) =>
                  setPaymentFilter(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="partial">
                  Partial
                </option>

                <option value="paid">
                  Paid
                </option>

              </select>

            </div>

            {/* STATUS */}

            <div className="col-lg-3">

              <label className="form-label">
                Training Status
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

                <option value="scheduled">
                  Scheduled
                </option>

                <option value="ongoing">
                  Ongoing
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
          TABLE
      ======================================== */}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-0 py-3">

          <div className="d-flex justify-content-between align-items-center">

            <div>

              <h5 className="fw-bold mb-1">
                Corporate Training Records
              </h5>

              <small className="text-muted">
                Showing{" "}
                {filteredTrainings.length}{" "}
                of{" "}
                {trainings.length}
              </small>

            </div>

            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={fetchTrainings}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>

          </div>

        </div>

        <div className="card-body p-0">

          {filteredTrainings.length === 0 ? (

            <div className="corporate-empty">

              <div className="corporate-empty-icon">
                <i className="bi bi-building-x"></i>
              </div>

              <h5 className="mt-3">
                No corporate trainings found
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

                    <th>
                      Client Company
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Training
                    </th>

                    <th>
                      Employees
                    </th>

                    <th>
                      Trainer
                    </th>

                    <th>
                      Start Date
                    </th>

                    <th>
                      End Date
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredTrainings.map(
                    (training) => (

                      <tr
                        key={
                          training._id
                        }
                      >

                        {/* CLIENT */}

                        <td>

                          <div className="d-flex align-items-center">

                            <div className="corporate-avatar">

                              {(
                                training
                                  .clientCompanyName ||
                                "C"
                              )
                                .charAt(0)
                                .toUpperCase()}

                            </div>

                            <div>

                              <div className="fw-semibold">

                                {
                                  training.clientCompanyName
                                }

                              </div>

                              <small className="text-muted">

                                {
                                  training.contactPerson
                                }

                              </small>

                            </div>

                          </div>

                        </td>

                        {/* CONTACT */}

                        <td>

                          <div>
                            {
                              training.contactNumber ||
                              "-"
                            }
                          </div>

                          {training.email && (

                            <small className="text-muted">
                              {
                                training.email
                              }
                            </small>

                          )}

                        </td>

                        {/* TRAINING */}

                        <td>

                          <div className="fw-semibold">

                            {
                              training.trainingTopic ||
                              "-"
                            }

                          </div>

                          {training.technology && (

                            <small className="text-muted">

                              {
                                training.technology
                              }

                            </small>

                          )}

                        </td>

                        {/* EMPLOYEES */}

                        <td>

                          <span className="badge bg-light text-dark border">

                            <i className="bi bi-people me-1"></i>

                            {
                              training.employeeCount ||
                              0
                            }

                          </span>

                        </td>

                        {/* TRAINER */}

                        <td>

                          {
                            training.trainer
                              ?.fullName || (

                              <span className="text-muted">
                                Unassigned
                              </span>

                            )
                          }

                        </td>

                        {/* START */}

                        <td>
                          {formatDate(
                            training.startDate
                          )}
                        </td>

                        {/* END */}

                        <td>
                          {formatDate(
                            training.endDate
                          )}
                        </td>

                        {/* AMOUNT */}

                        <td className="fw-semibold">

                          {formatCurrency(
                            training.paymentAmount
                          )}

                        </td>

                        {/* PAYMENT */}

                        <td>

                          <span
                            className={`badge bg-${getPaymentBadge(
                              training.paymentStatus
                            )}`}
                          >

                            {formatStatus(
                              training.paymentStatus
                            )}

                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <select
                            className="form-select form-select-sm corporate-status-select"
                            value={
                              training.trainingStatus
                            }
                            disabled={
                              statusLoading ===
                              training._id
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                training._id,
                                e.target.value
                              )
                            }
                          >

                            <option value="scheduled">
                              Scheduled
                            </option>

                            <option value="ongoing">
                              Ongoing
                            </option>

                            <option value="completed">
                              Completed
                            </option>

                            <option value="cancelled">
                              Cancelled
                            </option>

                          </select>

                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              openDetails(
                                training
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
          ADD TRAINING MODAL
      ======================================== */}

      {showModal && (

        <div
          className="custom-modal-backdrop"
          onClick={closeModal}
        >

          <div
            className="custom-modal corporate-training-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="custom-modal-header">

              <div>

                <h5 className="mb-1 fw-bold">
                  Add Corporate Training
                </h5>

                <small className="text-muted">
                  Create a new corporate training
                  program.
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

                  </div>

                )}

                <div className="row g-3">

                  {/* CLIENT COMPANY */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Client Company Name{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="clientCompanyName"
                      className="form-control"
                      placeholder="Enter client company name"
                      value={
                        formData.clientCompanyName
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* CONTACT PERSON */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Contact Person{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="contactPerson"
                      className="form-control"
                      placeholder="Enter contact person"
                      value={
                        formData.contactPerson
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* CONTACT NUMBER */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Contact Number{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="tel"
                      name="contactNumber"
                      className="form-control"
                      placeholder="Enter contact number"
                      value={
                        formData.contactNumber
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* EMAIL */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* TRAINING TOPIC */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Training Topic{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="trainingTopic"
                      className="form-control"
                      placeholder="e.g. Full Stack Development"
                      value={
                        formData.trainingTopic
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* TECHNOLOGY */}

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
                    />

                  </div>

                  {/* EMPLOYEE COUNT */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Employee Count{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="number"
                      name="employeeCount"
                      className="form-control"
                      min="1"
                      placeholder="Enter employee count"
                      value={
                        formData.employeeCount
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* TRAINER */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Trainer
                    </label>

                    <select
                      name="trainer"
                      className="form-select"
                      value={
                        formData.trainer
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        loadingUsers
                      }
                    >

                      <option value="">

                        {loadingUsers
                          ? "Loading trainers..."
                          : users.length === 0
                          ? "No active employees available"
                          : "Select trainer"}

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
                      Only active employees can be
                      assigned as trainers.
                    </small>

                  </div>

                  {/* START DATE */}

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
                    />

                  </div>

                  {/* END DATE */}

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
                    />

                  </div>

                  {/* PAYMENT AMOUNT */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Payment Amount
                    </label>

                    <div className="input-group">

                      <span className="input-group-text">
                        ₹
                      </span>

                      <input
                        type="number"
                        name="paymentAmount"
                        className="form-control"
                        min="0"
                        placeholder="0"
                        value={
                          formData.paymentAmount
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>

                  </div>

                  {/* PAYMENT STATUS */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Payment Status
                    </label>

                    <select
                      name="paymentStatus"
                      className="form-select"
                      value={
                        formData.paymentStatus
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="pending">
                        Pending
                      </option>

                      <option value="partial">
                        Partial
                      </option>

                      <option value="paid">
                        Paid
                      </option>

                    </select>

                  </div>

                  {/* TRAINING STATUS */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Training Status
                    </label>

                    <select
                      name="trainingStatus"
                      className="form-select"
                      value={
                        formData.trainingStatus
                      }
                      onChange={
                        handleChange
                      }
                    >

                      <option value="scheduled">
                        Scheduled
                      </option>

                      <option value="ongoing">
                        Ongoing
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>

                    </select>

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
                    loadingUsers
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
                      Create Training
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
        selectedTraining && (

          <div
            className="custom-modal-backdrop"
            onClick={closeDetails}
          >

            <div
              className="custom-modal corporate-details-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="custom-modal-header">

                <div>

                  <h5 className="mb-1 fw-bold">
                    Corporate Training Details
                  </h5>

                  <small className="text-muted">
                    Complete training information
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

                {/* COMPANY PROFILE */}

                <div className="corporate-detail-profile">

                  <div className="corporate-detail-avatar">

                    {(
                      selectedTraining
                        .clientCompanyName ||
                      "C"
                    )
                      .charAt(0)
                      .toUpperCase()}

                  </div>

                  <div>

                    <h5 className="mb-1">

                      {
                        selectedTraining.clientCompanyName
                      }

                    </h5>

                    <p className="text-muted mb-0">

                      {
                        selectedTraining.trainingTopic
                      }

                    </p>

                  </div>

                </div>

                {/* CLIENT INFORMATION */}

                <div className="corporate-detail-section">

                  <h6>

                    <i className="bi bi-building me-2"></i>

                    Client Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Client Company
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedTraining.clientCompanyName ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Contact Person
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedTraining.contactPerson ||
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
                          selectedTraining.contactNumber ||
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
                          selectedTraining.email ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Employee Count
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedTraining.employeeCount ||
                          0
                        }

                      </div>

                    </div>

                  </div>

                </div>

                {/* TRAINING INFORMATION */}

                <div className="corporate-detail-section">

                  <h6>

                    <i className="bi bi-mortarboard me-2"></i>

                    Training Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Training Topic
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedTraining.trainingTopic ||
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
                          selectedTraining.technology ||
                          "-"
                        }

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Trainer
                      </small>

                      <div className="fw-semibold">

                        {
                          selectedTraining
                            .trainer
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
                          selectedTraining.startDate
                        )}

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        End Date
                      </small>

                      <div className="fw-semibold">

                        {formatDate(
                          selectedTraining.endDate
                        )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* PAYMENT */}

                <div className="corporate-detail-section">

                  <h6>

                    <i className="bi bi-currency-rupee me-2"></i>

                    Payment Information

                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Payment Amount
                      </small>

                      <div className="fw-bold">

                        {formatCurrency(
                          selectedTraining.paymentAmount
                        )}

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Payment Status
                      </small>

                      <div className="mt-1">

                        <span
                          className={`badge bg-${getPaymentBadge(
                            selectedTraining.paymentStatus
                          )}`}
                        >

                          {formatStatus(
                            selectedTraining.paymentStatus
                          )}

                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                {/* STATUS */}

                <div className="corporate-detail-section">

                  <h6>

                    <i className="bi bi-bar-chart me-2"></i>

                    Training Status

                  </h6>

                  <span
                    className={`badge bg-${getTrainingStatusBadge(
                      selectedTraining.trainingStatus
                    )}`}
                  >

                    {formatStatus(
                      selectedTraining.trainingStatus
                    )}

                  </span>

                </div>

                {/* REMARKS */}

                <div className="corporate-detail-section">

                  <h6>

                    <i className="bi bi-chat-left-text me-2"></i>

                    Remarks

                  </h6>

                  <p className="text-muted mb-0">

                    {
                      selectedTraining.remarks ||
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

export default CorporateTraining;