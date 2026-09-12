import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import {
  createProject,
  getCompanyProjects,
  updateProject,
  updateProjectStatus,
  deleteProject,
} from "../../services/projectService";

import { getCompanyUsers } from "../../services/userService";

const Projects = () => {
  const { companyId } = useParams();

  // ========================================
  // STATE
  // ========================================

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState("");
  const [deleteLoading, setDeleteLoading] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ========================================
  // FORM
  // ========================================

  const initialForm = {
    clientName: "",
    clientCompany: "",
    contactNumber: "",
    email: "",
    projectTitle: "",
    projectDescription: "",
    technology: "",
    assignedDeveloper: "",
    startDate: "",
    deadline: "",
    budget: "",
    paidAmount: "",
    paymentStatus: "pending",
    projectStatus: "pending",
    deliveryDate: "",
    remarks: "",
  };

  const [formData, setFormData] = useState(initialForm);

  // ========================================
  // FETCH PROJECTS
  // ========================================

  const fetchProjects = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError("");

      const data = await getCompanyProjects(companyId);

      setProjects(
        data?.projects ||
          data?.data ||
          data ||
          []
      );
    } catch (error) {
      console.error(
        "Failed to load projects:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FETCH USERS
  // ========================================

  const fetchUsers = async () => {
    if (!companyId) return;

    try {
      setLoadingUsers(true);

      const data = await getCompanyUsers(companyId);

      const userList =
        data?.users ||
        data?.data ||
        data ||
        [];

      // Only active employees can be assigned
      // as project developers.
      const employeeUsers = Array.isArray(userList)
        ? userList.filter(
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
          "Failed to load developers."
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
      fetchProjects();
      fetchUsers();
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
    setEditingProject(null);

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
  // OPEN EDIT MODAL
  // ========================================

  const openEditModal = (project) => {
    setEditingProject(project);

    setFormData({
      clientName: project.clientName || "",
      clientCompany: project.clientCompany || "",
      contactNumber: project.contactNumber || "",
      email: project.email || "",
      projectTitle: project.projectTitle || "",
      projectDescription:
        project.projectDescription || "",
      technology: project.technology || "",
      assignedDeveloper:
        project.assignedDeveloper?._id ||
        project.assignedDeveloper ||
        "",
      startDate: project.startDate
        ? new Date(project.startDate)
            .toISOString()
            .split("T")[0]
        : "",
      deadline: project.deadline
        ? new Date(project.deadline)
            .toISOString()
            .split("T")[0]
        : "",
      budget: project.budget ?? "",
      paidAmount: project.paidAmount ?? "",
      paymentStatus:
        project.paymentStatus || "pending",
      projectStatus:
        project.projectStatus || "pending",
      deliveryDate: project.deliveryDate
        ? new Date(project.deliveryDate)
            .toISOString()
            .split("T")[0]
        : "",
      remarks: project.remarks || "",
    });

    setError("");
    setSuccess("");
    setShowDetailsModal(false);
    setShowModal(true);

    fetchUsers();
  };

  // ========================================
  // CLOSE ADD / EDIT MODAL
  // ========================================

  const closeModal = () => {
    if (submitLoading) return;

    setShowModal(false);
    setEditingProject(null);
    setFormData(initialForm);
    setError("");
  };

  // ========================================
  // SUBMIT PROJECT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.clientName.trim() ||
      !formData.projectTitle.trim() ||
      !formData.contactNumber.trim() ||
      !formData.startDate ||
      !formData.deadline
    ) {
      setError(
        "Client name, contact number, project title, start date and deadline are required."
      );

      return;
    }

    const budget = Number(formData.budget) || 0;
    const paidAmount =
      Number(formData.paidAmount) || 0;

    if (budget < 0) {
      setError("Budget cannot be negative.");
      return;
    }

    if (paidAmount < 0) {
      setError("Paid amount cannot be negative.");
      return;
    }

    if (paidAmount > budget && budget > 0) {
      setError(
        "Paid amount cannot be greater than budget."
      );

      return;
    }

    const startDate = new Date(
      formData.startDate
    );

    const deadline = new Date(
      formData.deadline
    );

    if (deadline < startDate) {
      setError(
        "Deadline cannot be before start date."
      );

      return;
    }

    if (
      formData.deliveryDate &&
      new Date(formData.deliveryDate) < startDate
    ) {
      setError(
        "Delivery date cannot be before start date."
      );

      return;
    }

    try {
      setSubmitLoading(true);

      const projectData = {
        company: companyId,

        clientName: formData.clientName.trim(),

        clientCompany:
          formData.clientCompany.trim() ||
          undefined,

        contactNumber:
          formData.contactNumber.trim(),

        email:
          formData.email.trim() || undefined,

        projectTitle:
          formData.projectTitle.trim(),

        projectDescription:
          formData.projectDescription.trim() ||
          undefined,

        technology:
          formData.technology.trim() ||
          undefined,

        assignedDeveloper:
          formData.assignedDeveloper ||
          undefined,

        startDate: formData.startDate,

        deadline: formData.deadline,

        budget,

        paidAmount,

        paymentStatus:
          formData.paymentStatus,

        projectStatus:
          formData.projectStatus,

        deliveryDate:
          formData.deliveryDate || undefined,

        remarks:
          formData.remarks.trim() || undefined,
      };

      if (editingProject) {
        await updateProject(
          editingProject._id,
          projectData
        );

        setSuccess(
          "Project updated successfully."
        );
      } else {
        await createProject(projectData);

        setSuccess(
          "Project created successfully."
        );
      }

      setShowModal(false);
      setEditingProject(null);
      setFormData(initialForm);

      await fetchProjects();
    } catch (error) {
      console.error(
        "Failed to save project:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to save project."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ========================================
  // UPDATE STATUS
  // ========================================

  const handleStatusChange = async (
    projectId,
    projectStatus
  ) => {
    try {
      setStatusLoading(projectId);

      setError("");
      setSuccess("");

      await updateProjectStatus(
        projectId,
        projectStatus
      );

      setSuccess(
        "Project status updated successfully."
      );

      await fetchProjects();
    } catch (error) {
      console.error(
        "Failed to update project status:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update project status."
      );
    } finally {
      setStatusLoading("");
    }
  };

  // ========================================
  // DELETE PROJECT
  // ========================================

  const handleDeleteProject = async (
    projectId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    try {
      setDeleteLoading(projectId);

      setError("");
      setSuccess("");

      await deleteProject(projectId);

      setSuccess(
        "Project deleted successfully."
      );

      setShowDetailsModal(false);
      setSelectedProject(null);

      await fetchProjects();
    } catch (error) {
      console.error(
        "Failed to delete project:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete project."
      );
    } finally {
      setDeleteLoading("");
    }
  };

  // ========================================
  // FILTER
  // ========================================

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        project.clientName
          ?.toLowerCase()
          .includes(searchValue) ||
        project.clientCompany
          ?.toLowerCase()
          .includes(searchValue) ||
        project.contactNumber
          ?.toLowerCase()
          .includes(searchValue) ||
        project.email
          ?.toLowerCase()
          .includes(searchValue) ||
        project.projectTitle
          ?.toLowerCase()
          .includes(searchValue) ||
        project.technology
          ?.toLowerCase()
          .includes(searchValue) ||
        project.assignedDeveloper
          ?.fullName
          ?.toLowerCase()
          .includes(searchValue);

      const matchesPayment =
        paymentFilter === "all" ||
        project.paymentStatus ===
          paymentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        project.projectStatus ===
          statusFilter;

      return (
        matchesSearch &&
        matchesPayment &&
        matchesStatus
      );
    });
  }, [
    projects,
    search,
    paymentFilter,
    statusFilter,
  ]);

  // ========================================
  // SUMMARY
  // ========================================

  const summary = useMemo(() => {
    const total = projects.length;

    const pending = projects.filter(
      (item) =>
        item.projectStatus === "pending"
    ).length;

    const inProgress = projects.filter(
      (item) =>
        item.projectStatus === "in_progress"
    ).length;

    const testing = projects.filter(
      (item) =>
        item.projectStatus === "testing"
    ).length;

    const completed = projects.filter(
      (item) =>
        item.projectStatus === "completed"
    ).length;

    const delivered = projects.filter(
      (item) =>
        item.projectStatus === "delivered"
    ).length;

    const totalBudget = projects.reduce(
      (total, item) =>
        total +
        (Number(item.budget) || 0),
      0
    );

    const totalPaid = projects.reduce(
      (total, item) =>
        total +
        (Number(item.paidAmount) || 0),
      0
    );

    return {
      total,
      pending,
      inProgress,
      testing,
      completed,
      delivered,
      totalBudget,
      totalPaid,
    };
  }, [projects]);

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

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatStatus = (status) => {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getProjectStatusBadge = (status) => {
    const badgeMap = {
      pending: "secondary",
      in_progress: "primary",
      testing: "warning",
      completed: "success",
      delivered: "success",
      cancelled: "danger",
    };

    return badgeMap[status] || "secondary";
  };

  const getPaymentBadge = (status) => {
    const badgeMap = {
      pending: "danger",
      partial: "warning",
      paid: "success",
    };

    return badgeMap[status] || "secondary";
  };

  // ========================================
  // DETAILS
  // ========================================

  const openDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setSelectedProject(null);
    setShowDetailsModal(false);
  };

  // ========================================
  // RESET
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
          Loading projects...
        </p>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="projects-page">

      {/* HEADER */}

      <div className="dashboard-page-header">

        <div>
          <h2 className="fw-bold mb-1">
            Projects
          </h2>

          <p className="text-muted mb-0">
            Manage client projects,
            developers, deadlines and payments.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openAddModal}
        >
          <i className="bi bi-folder-plus me-2"></i>
          Add Project
        </button>

      </div>

      {/* ALERTS */}

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

      {/* SUMMARY */}

      <div className="row g-4 mb-4">

        <div className="col-xl-3 col-md-6">
          <div className="project-stat-card">

            <div className="project-stat-icon primary">
              <i className="bi bi-folder"></i>
            </div>

            <div>
              <div className="text-muted small">
                Total Projects
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.total}
              </h3>
            </div>

          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="project-stat-card">

            <div className="project-stat-icon info">
              <i className="bi bi-arrow-repeat"></i>
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

        <div className="col-xl-3 col-md-6">
          <div className="project-stat-card">

            <div className="project-stat-icon warning">
              <i className="bi bi-bug"></i>
            </div>

            <div>
              <div className="text-muted small">
                Testing
              </div>

              <h3 className="mb-0 fw-bold">
                {summary.testing}
              </h3>
            </div>

          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="project-stat-card">

            <div className="project-stat-icon success">
              <i className="bi bi-currency-rupee"></i>
            </div>

            <div>
              <div className="text-muted small">
                Total Paid
              </div>

              <h3 className="mb-0 fw-bold">
                {formatCurrency(summary.totalPaid)}
              </h3>
            </div>

          </div>
        </div>

      </div>

      {/* FILTERS */}

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
                  placeholder="Search client, project, technology or developer..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

              </div>

            </div>

            <div className="col-lg-2">

              <label className="form-label">
                Payment
              </label>

              <select
                className="form-select"
                value={paymentFilter}
                onChange={(e) =>
                  setPaymentFilter(e.target.value)
                }
              >

                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>

              </select>

            </div>

            <div className="col-lg-3">

              <label className="form-label">
                Project Status
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

                <option value="pending">
                  Pending
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="testing">
                  Testing
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="delivered">
                  Delivered
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

              </select>

            </div>

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

      {/* PROJECT TABLE */}

      <div className="card border-0 shadow-sm">

        <div className="card-header bg-white border-0 py-3">

          <div className="d-flex justify-content-between align-items-center">

            <div>

              <h5 className="fw-bold mb-1">
                Project Records
              </h5>

              <small className="text-muted">
                Showing {filteredProjects.length} of{" "}
                {projects.length}
              </small>

            </div>

            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={fetchProjects}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>

          </div>

        </div>

        <div className="card-body p-0">

          {filteredProjects.length === 0 ? (

            <div className="project-empty">

              <div className="project-empty-icon">
                <i className="bi bi-folder-x"></i>
              </div>

              <h5 className="mt-3">
                No projects found
              </h5>

              <p className="text-muted mb-0">
                No project records match your
                current filters.
              </p>

            </div>

          ) : (

            <div className="table-responsive">

              <table className="table align-middle mb-0">

                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Project</th>
                    <th>Technology</th>
                    <th>Developer</th>
                    <th>Deadline</th>
                    <th>Budget</th>
                    <th>Paid</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredProjects.map(
                    (project) => (

                      <tr key={project._id}>

                        {/* CLIENT */}

                        <td>

                          <div className="d-flex align-items-center">

                            <div className="project-avatar">
                              {(
                                project.clientName || "C"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <div className="fw-semibold">
                                {project.clientName}
                              </div>

                              <small className="text-muted">
                                {project.clientCompany || "-"}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* PROJECT */}

                        <td>

                          <div className="fw-semibold">
                            {project.projectTitle}
                          </div>

                          <small className="text-muted">
                            Started{" "}
                            {formatDate(project.startDate)}
                          </small>

                        </td>

                        {/* TECHNOLOGY */}

                        <td>
                          {project.technology || "-"}
                        </td>

                        {/* DEVELOPER */}

                        <td>
                          {project.assignedDeveloper?.fullName || (
                            <span className="text-muted">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* DEADLINE */}

                        <td>
                          {formatDate(project.deadline)}
                        </td>

                        {/* BUDGET */}

                        <td className="fw-semibold">
                          {formatCurrency(project.budget)}
                        </td>

                        {/* PAID */}

                        <td>
                          {formatCurrency(project.paidAmount)}
                        </td>

                        {/* PAYMENT */}

                        <td>

                          <span
                            className={`badge bg-${getPaymentBadge(
                              project.paymentStatus
                            )}`}
                          >
                            {formatStatus(
                              project.paymentStatus
                            )}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <select
                            className="form-select form-select-sm project-status-select"
                            value={project.projectStatus}
                            disabled={
                              statusLoading === project._id
                            }
                            onChange={(e) =>
                              handleStatusChange(
                                project._id,
                                e.target.value
                              )
                            }
                          >

                            <option value="pending">
                              Pending
                            </option>

                            <option value="in_progress">
                              In Progress
                            </option>

                            <option value="testing">
                              Testing
                            </option>

                            <option value="completed">
                              Completed
                            </option>

                            <option value="delivered">
                              Delivered
                            </option>

                            <option value="cancelled">
                              Cancelled
                            </option>

                          </select>

                        </td>

                        {/* ACTION */}

                        <td>

                          <div className="d-flex gap-2">

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                openDetails(project)
                              }
                            >
                              <i className="bi bi-eye me-1"></i>
                              View
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() =>
                                openEditModal(project)
                              }
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                          </div>

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
          ADD / EDIT PROJECT MODAL
      ======================================== */}

      {showModal && (

        <div
          className="custom-modal-backdrop"
          onClick={closeModal}
        >

          <div
            className="custom-modal project-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="custom-modal-header">

              <div>

                <h5 className="mb-1 fw-bold">
                  {editingProject
                    ? "Edit Project"
                    : "Add Project"}
                </h5>

                <small className="text-muted">
                  {editingProject
                    ? "Update project information."
                    : "Create a new client project."}
                </small>

              </div>

              <button
                type="button"
                className="btn-close"
                onClick={closeModal}
                disabled={submitLoading}
              ></button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="custom-modal-body">

                {error && (
                  <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <div className="row g-3">

                  {/* CLIENT NAME */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Client Name{" "}
                      <span className="text-danger">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      name="clientName"
                      className="form-control"
                      placeholder="Enter client name"
                      value={formData.clientName}
                      onChange={handleChange}
                    />

                  </div>

                  {/* CLIENT COMPANY */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Client Company
                    </label>

                    <input
                      type="text"
                      name="clientCompany"
                      className="form-control"
                      placeholder="Enter company name"
                      value={formData.clientCompany}
                      onChange={handleChange}
                    />

                  </div>

                  {/* CONTACT */}

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
                      value={formData.contactNumber}
                      onChange={handleChange}
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
                      value={formData.email}
                      onChange={handleChange}
                    />

                  </div>

                  {/* PROJECT TITLE */}

                  <div className="col-12">

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
                      value={formData.projectTitle}
                      onChange={handleChange}
                    />

                  </div>

                  {/* DESCRIPTION */}

                  <div className="col-12">

                    <label className="form-label">
                      Project Description
                    </label>

                    <textarea
                      name="projectDescription"
                      className="form-control"
                      rows="3"
                      placeholder="Describe the project..."
                      value={formData.projectDescription}
                      onChange={handleChange}
                    ></textarea>

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
                      value={formData.technology}
                      onChange={handleChange}
                    />

                  </div>

                  {/* DEVELOPER */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Assigned Developer
                    </label>

                    <select
                      name="assignedDeveloper"
                      className="form-select"
                      value={formData.assignedDeveloper}
                      onChange={handleChange}
                      disabled={loadingUsers}
                    >

                      <option value="">
                        {loadingUsers
                          ? "Loading developers..."
                          : "Select developer"}
                      </option>

                      {users.map((user) => (
                        <option
                          key={user._id}
                          value={user._id}
                        >
                          {user.fullName}
                        </option>
                      ))}

                    </select>

                    <small className="text-muted">
                      Only active employees can be assigned as developers.
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
                      value={formData.startDate}
                      onChange={handleChange}
                    />

                  </div>

                  {/* DEADLINE */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Deadline{" "}
                      <span className="text-danger">
                        *
                      </span>
                    </label>

                    <input
                      type="date"
                      name="deadline"
                      className="form-control"
                      value={formData.deadline}
                      onChange={handleChange}
                    />

                  </div>

                  {/* BUDGET */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Budget
                    </label>

                    <div className="input-group">

                      <span className="input-group-text">
                        ₹
                      </span>

                      <input
                        type="number"
                        name="budget"
                        className="form-control"
                        min="0"
                        placeholder="0"
                        value={formData.budget}
                        onChange={handleChange}
                      />

                    </div>

                  </div>

                  {/* PAID AMOUNT */}

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
                        className="form-control"
                        min="0"
                        placeholder="0"
                        value={formData.paidAmount}
                        onChange={handleChange}
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
                      value={formData.paymentStatus}
                      onChange={handleChange}
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

                  {/* PROJECT STATUS */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Project Status
                    </label>

                    <select
                      name="projectStatus"
                      className="form-select"
                      value={formData.projectStatus}
                      onChange={handleChange}
                    >

                      <option value="pending">
                        Pending
                      </option>

                      <option value="in_progress">
                        In Progress
                      </option>

                      <option value="testing">
                        Testing
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="delivered">
                        Delivered
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>

                    </select>

                  </div>

                  {/* DELIVERY DATE */}

                  <div className="col-md-6">

                    <label className="form-label">
                      Delivery Date
                    </label>

                    <input
                      type="date"
                      name="deliveryDate"
                      className="form-control"
                      value={formData.deliveryDate}
                      onChange={handleChange}
                    />

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
                      value={formData.remarks}
                      onChange={handleChange}
                    ></textarea>

                  </div>

                </div>

              </div>

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={closeModal}
                  disabled={submitLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitLoading}
                >

                  {submitLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-2"></i>
                      {editingProject
                        ? "Update Project"
                        : "Create Project"}
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
        selectedProject && (

          <div
            className="custom-modal-backdrop"
            onClick={closeDetails}
          >

            <div
              className="custom-modal project-details-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="custom-modal-header">

                <div>

                  <h5 className="mb-1 fw-bold">
                    Project Details
                  </h5>

                  <small className="text-muted">
                    Complete project information
                  </small>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDetails}
                ></button>

              </div>

              <div className="custom-modal-body">

                {/* PROFILE */}

                <div className="project-detail-profile">

                  <div className="project-detail-avatar">
                    {(
                      selectedProject.clientName ||
                      "C"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <h5 className="mb-1">
                      {selectedProject.projectTitle}
                    </h5>

                    <p className="text-muted mb-0">
                      {selectedProject.clientName}

                      {selectedProject.clientCompany
                        ? ` • ${selectedProject.clientCompany}`
                        : ""}
                    </p>

                  </div>

                </div>

                {/* CLIENT */}

                <div className="project-detail-section">

                  <h6>
                    <i className="bi bi-person me-2"></i>
                    Client Information
                  </h6>

                  <div className="row g-3">

                    <div className="col-md-6">

                      <small className="text-muted">
                        Client Name
                      </small>

                      <div className="fw-semibold">
                        {selectedProject.clientName || "-"}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Client Company
                      </small>

                      <div className="fw-semibold">
                        {selectedProject.clientCompany || "-"}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Contact Number
                      </small>

                      <div className="fw-semibold">
                        {selectedProject.contactNumber || "-"}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Email
                      </small>

                      <div className="fw-semibold">
                        {selectedProject.email || "-"}
                      </div>

                    </div>

                  </div>

                </div>

                {/* PROJECT */}

                <div className="project-detail-section">

                  <h6>
                    <i className="bi bi-folder me-2"></i>
                    Project Information
                  </h6>

                  <div className="row g-3">

                    <div className="col-12">

                      <small className="text-muted">
                        Project Title
                      </small>

                      <div className="fw-semibold">
                        {selectedProject.projectTitle || "-"}
                      </div>

                    </div>

                    <div className="col-12">

                      <small className="text-muted">
                        Description
                      </small>

                      <div className="text-muted">
                        {selectedProject.projectDescription ||
                          "No description added."}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Technology
                      </small>

                      <div className="fw-semibold">
                        {selectedProject.technology || "-"}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Assigned Developer
                      </small>

                      <div className="fw-semibold">
                        {selectedProject.assignedDeveloper
                          ?.fullName ||
                          "Unassigned"}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Start Date
                      </small>

                      <div className="fw-semibold">
                        {formatDate(
                          selectedProject.startDate
                        )}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Deadline
                      </small>

                      <div className="fw-semibold">
                        {formatDate(
                          selectedProject.deadline
                        )}
                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Delivery Date
                      </small>

                      <div className="fw-semibold">
                        {formatDate(
                          selectedProject.deliveryDate
                        )}
                      </div>

                    </div>

                  </div>

                </div>

                {/* FINANCIAL */}

                <div className="project-detail-section">

                  <h6>
                    <i className="bi bi-currency-rupee me-2"></i>
                    Financial Information
                  </h6>

                  <div className="row g-3">

                    <div className="col-md-4">

                      <small className="text-muted">
                        Budget
                      </small>

                      <div className="fw-bold">
                        {formatCurrency(
                          selectedProject.budget
                        )}
                      </div>

                    </div>

                    <div className="col-md-4">

                      <small className="text-muted">
                        Paid Amount
                      </small>

                      <div className="fw-bold">
                        {formatCurrency(
                          selectedProject.paidAmount
                        )}
                      </div>

                    </div>

                    <div className="col-md-4">

                      <small className="text-muted">
                        Remaining
                      </small>

                      <div className="fw-bold">
                        {formatCurrency(
                          Math.max(
                            0,
                            (Number(
                              selectedProject.budget
                            ) || 0) -
                              (Number(
                                selectedProject.paidAmount
                              ) || 0)
                          )
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
                            selectedProject.paymentStatus
                          )}`}
                        >
                          {formatStatus(
                            selectedProject.paymentStatus
                          )}
                        </span>

                      </div>

                    </div>

                    <div className="col-md-6">

                      <small className="text-muted">
                        Project Status
                      </small>

                      <div className="mt-1">

                        <span
                          className={`badge bg-${getProjectStatusBadge(
                            selectedProject.projectStatus
                          )}`}
                        >
                          {formatStatus(
                            selectedProject.projectStatus
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                {/* REMARKS */}

                <div className="project-detail-section">

                  <h6>
                    <i className="bi bi-chat-left-text me-2"></i>
                    Remarks
                  </h6>

                  <p className="text-muted mb-0">
                    {selectedProject.remarks ||
                      "No remarks added."}
                  </p>

                </div>

              </div>

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={closeDetails}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    openEditModal(selectedProject)
                  }
                >
                  <i className="bi bi-pencil me-2"></i>
                  Edit
                </button>

                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={
                    deleteLoading ===
                    selectedProject._id
                  }
                  onClick={() =>
                    handleDeleteProject(
                      selectedProject._id
                    )
                  }
                >

                  {deleteLoading ===
                  selectedProject._id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Delete
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
};

export default Projects;