import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  createAdmission,
  getCompanyAdmissions,
} from "../../services/admissionService";

import { getLeads } from "../../services/leadService";

const Admissions = () => {
  const { companyId } = useParams();

  // ========================================
  // STATE
  // ========================================

  const [admissions, setAdmissions] = useState([]);
  const [leads, setLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] =
    useState(false);
  const [submitLoading, setSubmitLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [selectedAdmission, setSelectedAdmission] =
    useState(null);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [search, setSearch] = useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("all");

  // ========================================
  // FORM
  // ========================================

  const initialForm = {
    lead: "",
    studentName: "",
    contactNumber: "",
    email: "",
    courseName: "",
    batchName: "",
    fees: "",
    paidAmount: "",
    paymentStatus: "pending",
    internshipAssigned: false,
    placementSupport: true,
    admissionDate: "",
    remarks: "",
  };

  const [formData, setFormData] =
    useState(initialForm);

  // ========================================
  // FETCH ADMISSIONS
  // ========================================

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      setError("");

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
          "Failed to load admissions."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FETCH CONVERTED LEADS
  // ========================================

  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);

      const data = await getLeads(companyId);

      const allLeads =
        data?.leads ||
        data?.data ||
        data ||
        [];

      const convertedLeads = allLeads.filter(
        (lead) => lead.status === "converted"
      );

      setLeads(convertedLeads);
    } catch (error) {
      console.error(
        "Failed to load leads:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load converted leads."
      );
    } finally {
      setLoadingLeads(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    if (companyId) {
      fetchAdmissions();
      fetchLeads();
    }
  }, [companyId]);

  // ========================================
  // HANDLE FORM CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ========================================
  // HANDLE LEAD SELECTION
  // ========================================

  const handleLeadChange = (e) => {
    const selectedLeadId = e.target.value;

    const selectedLead = leads.find(
      (lead) => lead._id === selectedLeadId
    );

    if (!selectedLead) {
      setFormData((prev) => ({
        ...prev,
        lead: "",
        studentName: "",
        contactNumber: "",
        email: "",
        courseName: "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,

      lead: selectedLead._id,

      studentName:
        selectedLead.fullName || "",

      contactNumber:
        selectedLead.contactNumber || "",

      email:
        selectedLead.email || "",

      courseName:
        selectedLead.courseInterested || "",
    }));
  };

  // ========================================
  // OPEN ADD MODAL
  // ========================================

  const openAddModal = () => {
    setFormData({
      ...initialForm,
      admissionDate: new Date()
        .toISOString()
        .split("T")[0],
    });

    setError("");
    setSuccess("");

    setShowModal(true);

    // Refresh converted leads when opening
    fetchLeads();
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
  // CALCULATE PAYMENT STATUS
  // ========================================

  const calculatePaymentStatus = (
    fees,
    paidAmount
  ) => {
    const totalFees = Number(fees) || 0;
    const paid = Number(paidAmount) || 0;

    if (paid <= 0) {
      return "pending";
    }

    if (paid >= totalFees) {
      return "paid";
    }

    return "partial";
  };

  // ========================================
  // SUBMIT ADMISSION
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.lead) {
      setError(
        "Please select a converted lead."
      );

      return;
    }

    if (
      !formData.studentName ||
      !formData.contactNumber ||
      !formData.courseName ||
      !formData.batchName ||
      !formData.fees
    ) {
      setError(
        "Student name, contact number, course, batch and fees are required."
      );

      return;
    }

    const fees = Number(formData.fees);

    const paidAmount =
      Number(formData.paidAmount) || 0;

    if (fees < 0) {
      setError(
        "Fees cannot be negative."
      );

      return;
    }

    if (paidAmount < 0) {
      setError(
        "Paid amount cannot be negative."
      );

      return;
    }

    if (paidAmount > fees) {
      setError(
        "Paid amount cannot be greater than total fees."
      );

      return;
    }

    const paymentStatus =
      calculatePaymentStatus(
        fees,
        paidAmount
      );

    try {
      setSubmitLoading(true);

      const admissionData = {
        company: companyId,

        lead: formData.lead,

        studentName:
          formData.studentName.trim(),

        contactNumber:
          formData.contactNumber.trim(),

        email:
          formData.email.trim() || undefined,

        courseName:
          formData.courseName.trim(),

        batchName:
          formData.batchName.trim(),

        fees,

        paidAmount,

        paymentStatus,

        internshipAssigned:
          formData.internshipAssigned,

        placementSupport:
          formData.placementSupport,

        admissionDate:
          formData.admissionDate || undefined,

        remarks:
          formData.remarks.trim() ||
          undefined,
      };

      await createAdmission(admissionData);

      setSuccess(
        "Admission created successfully."
      );

      setShowModal(false);

      setFormData(initialForm);

      await fetchAdmissions();

      await fetchLeads();
    } catch (error) {
      console.error(
        "Failed to create admission:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create admission."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ========================================
  // FILTER ADMISSIONS
  // ========================================

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((admission) => {
      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        admission.studentName
          ?.toLowerCase()
          .includes(searchValue) ||
        admission.contactNumber
          ?.toLowerCase()
          .includes(searchValue) ||
        admission.email
          ?.toLowerCase()
          .includes(searchValue) ||
        admission.courseName
          ?.toLowerCase()
          .includes(searchValue) ||
        admission.batchName
          ?.toLowerCase()
          .includes(searchValue);

      const matchesPayment =
        paymentFilter === "all" ||
        admission.paymentStatus ===
          paymentFilter;

      return (
        matchesSearch &&
        matchesPayment
      );
    });
  }, [
    admissions,
    search,
    paymentFilter,
  ]);

  // ========================================
  // SUMMARY
  // ========================================

  const summary = useMemo(() => {
    const totalAdmissions =
      admissions.length;

    const totalFees = admissions.reduce(
      (total, admission) =>
        total +
        (Number(admission.fees) || 0),
      0
    );

    const totalPaid = admissions.reduce(
      (total, admission) =>
        total +
        (Number(
          admission.paidAmount
        ) || 0),
      0
    );

    const totalPending =
      totalFees - totalPaid;

    const paidAdmissions =
      admissions.filter(
        (admission) =>
          admission.paymentStatus ===
          "paid"
      ).length;

    const partialAdmissions =
      admissions.filter(
        (admission) =>
          admission.paymentStatus ===
          "partial"
      ).length;

    const internshipCount =
      admissions.filter(
        (admission) =>
          admission.internshipAssigned
      ).length;

    const placementCount =
      admissions.filter(
        (admission) =>
          admission.placementSupport
      ).length;

    return {
      totalAdmissions,
      totalFees,
      totalPaid,
      totalPending,
      paidAdmissions,
      partialAdmissions,
      internshipCount,
      placementCount,
    };
  }, [admissions]);

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

  const formatPaymentStatus = (status) => {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getPaymentBadge = (status) => {
    const badgeMap = {
      pending: "danger",
      partial: "warning",
      paid: "success",
    };

    return (
      badgeMap[status] || "secondary"
    );
  };

  // ========================================
  // DETAILS MODAL
  // ========================================

  const openDetails = (admission) => {
    setSelectedAdmission(admission);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setSelectedAdmission(null);
    setShowDetailsModal(false);
  };

  // ========================================
  // RESET FILTERS
  // ========================================

  const resetFilters = () => {
    setSearch("");
    setPaymentFilter("all");
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-border text-primary"></div>

        <p className="mt-3 mb-0">
          Loading admissions...
        </p>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="admissions-page">

      {/* ========================================
          PAGE HEADER
      ======================================== */}

      <div className="dashboard-page-header">

        <div>
          <h2 className="fw-bold mb-1">
            Admissions
          </h2>

          <p className="text-muted mb-0">
            Manage student admissions,
            fees and enrollment details.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={openAddModal}
        >
          <i className="bi bi-person-plus me-2"></i>
          Add Admission
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

        {/* TOTAL ADMISSIONS */}

        <div className="col-xl-3 col-md-6">

          <div className="admission-stat-card">

            <div className="admission-stat-icon primary">
              <i className="bi bi-people"></i>
            </div>

            <div>
              <div className="text-muted small">
                Total Admissions
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.totalAdmissions}
              </h3>
            </div>

          </div>

        </div>

        {/* TOTAL COLLECTED */}

        <div className="col-xl-3 col-md-6">

          <div className="admission-stat-card">

            <div className="admission-stat-icon success">
              <i className="bi bi-cash-stack"></i>
            </div>

            <div>
              <div className="text-muted small">
                Total Collected
              </div>

              <h3 className="mb-0 fw-bold">
                {formatCurrency(
                  summary.totalPaid
                )}
              </h3>
            </div>

          </div>

        </div>

        {/* PENDING FEES */}

        <div className="col-xl-3 col-md-6">

          <div className="admission-stat-card">

            <div className="admission-stat-icon danger">
              <i className="bi bi-wallet2"></i>
            </div>

            <div>
              <div className="text-muted small">
                Pending Fees
              </div>

              <h3 className="mb-0 fw-bold">
                {formatCurrency(
                  summary.totalPending
                )}
              </h3>
            </div>

          </div>

        </div>

        {/* INTERNSHIP */}

        <div className="col-xl-3 col-md-6">

          <div className="admission-stat-card">

            <div className="admission-stat-icon warning">
              <i className="bi bi-briefcase"></i>
            </div>

            <div>
              <div className="text-muted small">
                Internship Assigned
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.internshipCount}
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
                  placeholder="Search student, phone, email, course or batch..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* PAYMENT FILTER */}

            <div className="col-lg-3">

              <label className="form-label">
                Payment Status
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
                  All Payment Status
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

            {/* RESET */}

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
          ADMISSION TABLE
      ======================================== */}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-0 py-3">

          <div className="d-flex justify-content-between align-items-center">

            <div>

              <h5 className="fw-bold mb-1">
                Admission Records
              </h5>

              <small className="text-muted">
                Showing{" "}
                {filteredAdmissions.length}{" "}
                of{" "}
                {admissions.length}
              </small>

            </div>

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={fetchAdmissions}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>

          </div>

        </div>

        <div className="card-body p-0">

          {filteredAdmissions.length === 0 ? (

            <div className="admission-empty">

              <div className="admission-empty-icon">
                <i className="bi bi-person-x"></i>
              </div>

              <h5 className="mt-3">
                No admissions found
              </h5>

              <p className="text-muted mb-0">
                No admission records match
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
                      Contact
                    </th>

                    <th>
                      Course
                    </th>

                    <th>
                      Batch
                    </th>

                    <th>
                      Fees
                    </th>

                    <th>
                      Paid
                    </th>

                    <th>
                      Balance
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Internship
                    </th>

                    <th>
                      Placement
                    </th>

                    <th>
                      Admission Date
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredAdmissions.map(
                    (admission) => {

                      const fees =
                        Number(
                          admission.fees
                        ) || 0;

                      const paid =
                        Number(
                          admission.paidAmount
                        ) || 0;

                      const balance =
                        fees - paid;

                      return (

                        <tr
                          key={
                            admission._id
                          }
                        >

                          {/* STUDENT */}

                          <td>

                            <div className="d-flex align-items-center">

                              <div className="admission-avatar">

                                {admission.studentName
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase()}

                              </div>

                              <div>

                                <div className="fw-semibold">
                                  {
                                    admission.studentName
                                  }
                                </div>

                                {admission.email && (
                                  <small className="text-muted">
                                    {
                                      admission.email
                                    }
                                  </small>
                                )}

                              </div>

                            </div>

                          </td>

                          {/* CONTACT */}

                          <td>
                            {
                              admission.contactNumber ||
                              "-"
                            }
                          </td>

                          {/* COURSE */}

                          <td>
                            {
                              admission.courseName ||
                              "-"
                            }
                          </td>

                          {/* BATCH */}

                          <td>
                            {
                              admission.batchName ||
                              "-"
                            }
                          </td>

                          {/* FEES */}

                          <td>
                            {formatCurrency(
                              fees
                            )}
                          </td>

                          {/* PAID */}

                          <td className="text-success fw-semibold">
                            {formatCurrency(
                              paid
                            )}
                          </td>

                          {/* BALANCE */}

                          <td
                            className={
                              balance > 0
                                ? "text-danger fw-semibold"
                                : "text-success fw-semibold"
                            }
                          >
                            {formatCurrency(
                              balance
                            )}
                          </td>

                          {/* PAYMENT */}

                          <td>

                            <span
                              className={`badge bg-${getPaymentBadge(
                                admission.paymentStatus
                              )}`}
                            >
                              {formatPaymentStatus(
                                admission.paymentStatus
                              )}
                            </span>

                          </td>

                          {/* INTERNSHIP */}

                          <td>

                            {admission.internshipAssigned ? (

                              <span className="badge bg-success">
                                Yes
                              </span>

                            ) : (

                              <span className="badge bg-secondary">
                                No
                              </span>

                            )}

                          </td>

                          {/* PLACEMENT */}

                          <td>

                            {admission.placementSupport ? (

                              <span className="badge bg-success">
                                Yes
                              </span>

                            ) : (

                              <span className="badge bg-secondary">
                                No
                              </span>

                            )}

                          </td>

                          {/* DATE */}

                          <td>
                            {formatDate(
                              admission.admissionDate
                            )}
                          </td>

                          {/* ACTION */}

                          <td>

                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                openDetails(
                                  admission
                                )
                              }
                            >
                              <i className="bi bi-eye me-1"></i>
                              View
                            </button>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* ========================================
          ADD ADMISSION MODAL
      ======================================== */}

      {showModal && (

        <div
          className="custom-modal-backdrop"
          onClick={closeModal}
        >

          <div
            className="custom-modal admission-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="custom-modal-header">

              <div>

                <h5 className="mb-1 fw-bold">
                  Add Admission
                </h5>

                <small className="text-muted">
                  Create a new student admission
                </small>

              </div>

              <button
                className="btn-close"
                onClick={closeModal}
                disabled={submitLoading}
              ></button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="custom-modal-body">

                {/* ERROR */}

                {error && (

                  <div className="alert alert-danger">

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    {error}

                  </div>

                )}

                <div className="row g-3">

                  {/* ========================================
                      LEAD
                  ======================================== */}

                  <div className="col-12">

                    <label className="form-label">

                      Select Lead{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <select
                      name="lead"
                      className="form-select"
                      value={formData.lead}
                      onChange={
                        handleLeadChange
                      }
                      disabled={
                        loadingLeads
                      }
                    >

                      <option value="">

                        {loadingLeads
                          ? "Loading converted leads..."
                          : "Select a converted lead"}

                      </option>

                      {leads.map(
                        (lead) => (

                          <option
                            key={
                              lead._id
                            }
                            value={
                              lead._id
                            }
                          >

                            {lead.fullName}

                            {lead.contactNumber
                              ? ` - ${lead.contactNumber}`
                              : ""}

                            {lead.courseInterested
                              ? ` - ${lead.courseInterested}`
                              : ""}

                          </option>

                        )
                      )}

                    </select>

                    {!loadingLeads &&
                      leads.length === 0 && (

                        <small className="text-danger">

                          No converted leads
                          available for this
                          company.

                        </small>

                      )}

                    {leads.length > 0 && (

                      <small className="text-muted">

                        Only converted leads
                        from the current company
                        are shown.

                      </small>

                    )}

                  </div>

                  {/* ========================================
                      STUDENT NAME
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Student Name{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="studentName"
                      className="form-control"
                      placeholder="Select a lead first"
                      value={
                        formData.studentName
                      }
                      readOnly
                    />

                  </div>

                  {/* ========================================
                      CONTACT NUMBER
                  ======================================== */}

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
                      placeholder="Select a lead first"
                      value={
                        formData.contactNumber
                      }
                      readOnly
                    />

                  </div>

                  {/* ========================================
                      EMAIL
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Select a lead first"
                      value={
                        formData.email
                      }
                      readOnly
                    />

                  </div>

                  {/* ========================================
                      COURSE
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Course Name{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="courseName"
                      className="form-control"
                      placeholder="Select a lead first"
                      value={
                        formData.courseName
                      }
                      readOnly
                    />

                  </div>

                  {/* ========================================
                      BATCH
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Batch Name{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      name="batchName"
                      className="form-control"
                      placeholder="Enter batch name"
                      value={
                        formData.batchName
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* ========================================
                      ADMISSION DATE
                  ======================================== */}

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
                        handleChange
                      }
                    />

                  </div>

                  {/* ========================================
                      FEES
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">

                      Total Fees{" "}

                      <span className="text-danger">
                        *
                      </span>

                    </label>

                    <div className="input-group">

                      <span className="input-group-text">
                        ₹
                      </span>

                      <input
                        type="number"
                        name="fees"
                        min="0"
                        className="form-control"
                        placeholder="0"
                        value={
                          formData.fees
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>

                  </div>

                  {/* ========================================
                      PAID AMOUNT
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Paid Amount
                    </label>

                    <div className="input-group">

                      <span className="input-group-text">
                        ₹
                      </span>

                      <input
                        type="number"
                        name="paidAmount"
                        min="0"
                        className="form-control"
                        placeholder="0"
                        value={
                          formData.paidAmount
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>

                  </div>

                  {/* ========================================
                      PAYMENT STATUS
                  ======================================== */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Payment Status
                    </label>

                    <select
                      className="form-select"
                      name="paymentStatus"
                      value={calculatePaymentStatus(
                        formData.fees,
                        formData.paidAmount
                      )}
                      disabled
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

                    <small className="text-muted">

                      Automatically calculated
                      from fees and paid amount.

                    </small>

                  </div>

                  {/* ========================================
                      INTERNSHIP
                  ======================================== */}

                  <div className="col-md-6">

                    <div className="form-check mt-4">

                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="internshipAssigned"
                        name="internshipAssigned"
                        checked={
                          formData.internshipAssigned
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <label
                        className="form-check-label"
                        htmlFor="internshipAssigned"
                      >
                        Internship Assigned
                      </label>

                    </div>

                  </div>

                  {/* ========================================
                      PLACEMENT
                  ======================================== */}

                  <div className="col-md-6">

                    <div className="form-check mt-4">

                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="placementSupport"
                        name="placementSupport"
                        checked={
                          formData.placementSupport
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <label
                        className="form-check-label"
                        htmlFor="placementSupport"
                      >
                        Placement Support
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
                    ></textarea>

                  </div>

                </div>

              </div>

              {/* MODAL FOOTER */}

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
                    loadingLeads
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
                      Create Admission
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
        selectedAdmission && (

          <div
            className="custom-modal-backdrop"
            onClick={closeDetails}
          >

            <div
              className="custom-modal admission-details-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="custom-modal-header">

                <div>

                  <h5 className="mb-1 fw-bold">
                    Admission Details
                  </h5>

                  <small className="text-muted">
                    Complete student admission
                    information
                  </small>

                </div>

                <button
                  className="btn-close"
                  onClick={closeDetails}
                ></button>

              </div>

              {/* BODY */}

              <div className="custom-modal-body">

                {/* PROFILE */}

                <div className="admission-detail-profile">

                  <div className="admission-detail-avatar">

                    {selectedAdmission.studentName
                      ?.charAt(0)
                      ?.toUpperCase()}

                  </div>

                  <div>

                    <h5 className="mb-1">
                      {
                        selectedAdmission.studentName
                      }
                    </h5>

                    <p className="text-muted mb-0">
                      {
                        selectedAdmission.courseName
                      }
                    </p>

                  </div>

                </div>

                {/* STUDENT INFORMATION */}

                <div className="admission-detail-section">

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
                          selectedAdmission.studentName
                        }
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Contact Number
                      </small>

                      <div className="fw-semibold">
                        {
                          selectedAdmission.contactNumber ||
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
                          selectedAdmission.email ||
                          "-"
                        }
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Lead ID
                      </small>

                      <div className="fw-semibold">

                        {typeof selectedAdmission.lead ===
                        "object"
                          ? selectedAdmission
                              .lead?._id
                          : selectedAdmission.lead ||
                            "-"}

                      </div>

                    </div>

                  </div>

                </div>

                {/* COURSE INFORMATION */}

                <div className="admission-detail-section">

                  <h6>
                    <i className="bi bi-book me-2"></i>
                    Course Information
                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Course
                      </small>

                      <div className="fw-semibold">
                        {
                          selectedAdmission.courseName
                        }
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Batch
                      </small>

                      <div className="fw-semibold">
                        {
                          selectedAdmission.batchName
                        }
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Admission Date
                      </small>

                      <div className="fw-semibold">
                        {formatDate(
                          selectedAdmission.admissionDate
                        )}
                      </div>

                    </div>

                  </div>

                </div>

                {/* PAYMENT INFORMATION */}

                <div className="admission-detail-section">

                  <h6>
                    <i className="bi bi-currency-rupee me-2"></i>
                    Payment Information
                  </h6>

                  <div className="row g-3">

                    <div className="col-md-4">

                      <small className="text-muted">
                        Total Fees
                      </small>

                      <div className="fw-bold">
                        {formatCurrency(
                          selectedAdmission.fees
                        )}
                      </div>

                    </div>

                    <div className="col-md-4">

                      <small className="text-muted">
                        Paid Amount
                      </small>

                      <div className="fw-bold text-success">
                        {formatCurrency(
                          selectedAdmission.paidAmount
                        )}
                      </div>

                    </div>

                    <div className="col-md-4">

                      <small className="text-muted">
                        Balance
                      </small>

                      <div className="fw-bold text-danger">

                        {formatCurrency(
                          (Number(
                            selectedAdmission.fees
                          ) || 0) -
                            (Number(
                              selectedAdmission.paidAmount
                            ) || 0)
                        )}

                      </div>

                    </div>

                    <div className="col-12">

                      <small className="text-muted">
                        Payment Status
                      </small>

                      <div className="mt-1">

                        <span
                          className={`badge bg-${getPaymentBadge(
                            selectedAdmission.paymentStatus
                          )}`}
                        >
                          {formatPaymentStatus(
                            selectedAdmission.paymentStatus
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                {/* SUPPORT & SERVICES */}

                <div className="admission-detail-section">

                  <h6>
                    <i className="bi bi-gear me-2"></i>
                    Support & Services
                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Internship Assigned
                      </small>

                      <div className="mt-1">

                        {selectedAdmission.internshipAssigned ? (

                          <span className="badge bg-success">
                            Yes
                          </span>

                        ) : (

                          <span className="badge bg-secondary">
                            No
                          </span>

                        )}

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Placement Support
                      </small>

                      <div className="mt-1">

                        {selectedAdmission.placementSupport ? (

                          <span className="badge bg-success">
                            Yes
                          </span>

                        ) : (

                          <span className="badge bg-secondary">
                            No
                          </span>

                        )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* REMARKS */}

                <div className="admission-detail-section">

                  <h6>
                    <i className="bi bi-chat-left-text me-2"></i>
                    Remarks
                  </h6>

                  <p className="mb-0 text-muted">
                    {
                      selectedAdmission.remarks ||
                      "No remarks added."
                    }
                  </p>

                </div>

              </div>

              {/* FOOTER */}

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

export default Admissions;