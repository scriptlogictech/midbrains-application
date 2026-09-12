import React, { useEffect, useState } from "react";
import {
    getUsers,
    createUser,
    updateUser,
    updateUserStatus,
} from "../../services/userService";
import api from "../../services/api";
import "./Users.css";

const initialForm = {
    fullName: "",
    email: "",
    password: "",
    role: "employee",
    company: "",
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [form, setForm] = useState(initialForm);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        fetchUsers();
        fetchCompanies();
    }, []);

    // ==========================================
    // Fetch Users
    // ==========================================

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getUsers();

            setUsers(
                response?.users ||
                    response?.data ||
                    []
            );
        } catch (err) {
            console.error("Fetch Users Error:", err);

            setError(
                err.response?.data?.message ||
                    "Failed to load users"
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // Fetch Companies
    // ==========================================

    const fetchCompanies = async () => {
        try {
            const response = await api.get("/companies");

            setCompanies(
                response?.data?.companies ||
                    response?.data?.data ||
                    response?.data ||
                    []
            );
        } catch (err) {
            console.error(
                "Fetch Companies Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to load companies"
            );
        }
    };

    // ==========================================
    // Form Change
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // Open Add User Modal
    // ==========================================

    const openAddModal = () => {
        setEditingUser(null);

        setForm({
            ...initialForm,
            role: "employee",
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // ==========================================
    // Open Edit User Modal
    // ==========================================

    const openEditModal = (user) => {
        // Super Admin cannot be edited
        if (user.role === "super_admin") {
            return;
        }

        setEditingUser(user);

        setForm({
            fullName: user.fullName || "",
            email: user.email || "",
            password: "",
            role: user.role || "employee",
            company:
                user.company?._id ||
                user.company ||
                "",
        });

        setError("");
        setSuccess("");

        setShowModal(true);
    };

    // ==========================================
    // Close Modal
    // ==========================================

    const closeModal = () => {
        if (formLoading) return;

        setShowModal(false);
        setEditingUser(null);
        setForm({
            ...initialForm,
            role: "employee",
        });
    };

    // ==========================================
    // Submit User
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.fullName.trim()) {
            setError("Full name is required");
            return;
        }

        if (!form.email.trim()) {
            setError("Email is required");
            return;
        }

        if (!editingUser && !form.password) {
            setError("Password is required");
            return;
        }

        if (
            !editingUser &&
            form.password.length < 6
        ) {
            setError(
                "Password must be at least 6 characters"
            );
            return;
        }

        if (!form.role) {
            setError("Please select a role");
            return;
        }

        if (
            !["employee", "intern"].includes(
                form.role
            )
        ) {
            setError(
                "Only Employee and Intern users can be created or modified"
            );
            return;
        }

        if (!form.company) {
            setError("Please select a company");
            return;
        }

        try {
            setFormLoading(true);

            if (editingUser) {
                const updateData = {
                    fullName:
                        form.fullName.trim(),
                    email: form.email.trim(),
                    role: form.role,
                    company: form.company,
                };

                if (form.password.trim()) {
                    updateData.password =
                        form.password;
                }

                const response =
                    await updateUser(
                        editingUser._id,
                        updateData
                    );

                setSuccess(
                    response?.message ||
                        "User updated successfully"
                );
            } else {
                const response =
                    await createUser({
                        fullName:
                            form.fullName.trim(),
                        email:
                            form.email.trim(),
                        password:
                            form.password,
                        role: form.role,
                        company: form.company,
                    });

                setSuccess(
                    response?.message ||
                        "User created successfully"
                );
            }

            await fetchUsers();

            setTimeout(() => {
                closeModal();
                setSuccess("");
            }, 700);
        } catch (err) {
            console.error(
                "Save User Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to save user"
            );
        } finally {
            setFormLoading(false);
        }
    };

    // ==========================================
    // Toggle User Status
    // ==========================================

    const handleStatusToggle = async (user) => {
        // Super Admin status cannot be changed
        if (user.role === "super_admin") {
            return;
        }

        const newStatus = !user.isActive;

        try {
            setError("");
            setSuccess("");

            await updateUserStatus(
                user._id,
                newStatus
            );

            setUsers((prevUsers) =>
                prevUsers.map((item) =>
                    item._id === user._id
                        ? {
                              ...item,
                              isActive:
                                  newStatus,
                          }
                        : item
                )
            );

            setSuccess(
                `User ${
                    newStatus
                        ? "activated"
                        : "deactivated"
                } successfully`
            );

            setTimeout(() => {
                setSuccess("");
            }, 2000);
        } catch (err) {
            console.error(
                "Update User Status Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Failed to update user status"
            );
        }
    };

    // ==========================================
    // Get Company Name
    // ==========================================

    const getCompanyName = (company) => {
        if (!company) return "—";

        if (typeof company === "object") {
            return (
                company.companyName ||
                company.name ||
                "—"
            );
        }

        const foundCompany = companies.find(
            (item) => item._id === company
        );

        return foundCompany?.companyName || "—";
    };

    // ==========================================
    // Get Role Label
    // ==========================================

    const getRoleLabel = (role) => {
        const roles = {
            super_admin: "Super Admin",
            employee: "Employee",
            intern: "Intern",
        };

        return roles[role] || role;
    };

    // ==========================================
    // Filter Users
    // ==========================================

    const filteredUsers = users.filter((user) => {
        const searchValue = search
            .toLowerCase()
            .trim();

        const matchesSearch =
            !searchValue ||
            user.fullName
                ?.toLowerCase()
                .includes(searchValue) ||
            user.email
                ?.toLowerCase()
                .includes(searchValue) ||
            getCompanyName(user.company)
                ?.toLowerCase()
                .includes(searchValue);

        const matchesRole =
            !roleFilter ||
            user.role === roleFilter;

        const matchesStatus =
            !statusFilter ||
            (statusFilter === "active" &&
                user.isActive) ||
            (statusFilter === "inactive" &&
                !user.isActive);

        return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
        );
    });

    // ==========================================
    // Summary
    // ==========================================

    const totalUsers = users.length;

    const activeUsers = users.filter(
        (user) => user.isActive
    ).length;

    const inactiveUsers = users.filter(
        (user) => !user.isActive
    ).length;

    const employees = users.filter(
        (user) => user.role === "employee"
    ).length;

    // ==========================================
    // Loading
    // ==========================================

    if (loading) {
        return (
            <div className="users-page">
                <div className="users-loading">
                    <div className="spinner-border text-primary" />
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="users-page">

            {/* ===============================
                Header
            =============================== */}

            <div className="users-header">

                <div>
                    <h2>User Management</h2>

                    <p>
                        Manage company users, roles and access
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openAddModal}
                >
                    <i className="bi bi-person-plus me-2"></i>
                    Add User
                </button>

            </div>

            {/* ===============================
                Alerts
            =============================== */}

            {error && (
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

            {/* ===============================
                Summary Cards
            =============================== */}

            <div className="user-summary-grid">

                <div className="user-summary-card">

                    <div className="user-summary-icon">
                        <i className="bi bi-people"></i>
                    </div>

                    <div>
                        <span>Total Users</span>
                        <h3>{totalUsers}</h3>
                    </div>

                </div>

                <div className="user-summary-card">

                    <div className="user-summary-icon">
                        <i className="bi bi-person-check"></i>
                    </div>

                    <div>
                        <span>Active Users</span>
                        <h3>{activeUsers}</h3>
                    </div>

                </div>

                <div className="user-summary-card">

                    <div className="user-summary-icon">
                        <i className="bi bi-person-x"></i>
                    </div>

                    <div>
                        <span>Inactive Users</span>
                        <h3>{inactiveUsers}</h3>
                    </div>

                </div>

                <div className="user-summary-card">

                    <div className="user-summary-icon">
                        <i className="bi bi-person-badge"></i>
                    </div>

                    <div>
                        <span>Employees</span>
                        <h3>{employees}</h3>
                    </div>

                </div>

            </div>

            {/* ===============================
                Filters
            =============================== */}

            <div className="users-filter-card">

                <div className="users-search">

                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        placeholder="Search by name, email or company..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

                <select
                    className="form-select"
                    value={roleFilter}
                    onChange={(e) =>
                        setRoleFilter(
                            e.target.value
                        )
                    }
                >

                    <option value="">
                        All Roles
                    </option>

                    <option value="super_admin">
                        Super Admin
                    </option>

                    <option value="employee">
                        Employee
                    </option>

                    <option value="intern">
                        Intern
                    </option>

                </select>

                <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                >

                    <option value="">
                        All Status
                    </option>

                    <option value="active">
                        Active
                    </option>

                    <option value="inactive">
                        Inactive
                    </option>

                </select>

                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                        setSearch("");
                        setRoleFilter("");
                        setStatusFilter("");
                    }}
                >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                    Reset
                </button>

            </div>

            {/* ===============================
                Users Table
            =============================== */}

            <div className="users-table-card">

                <div className="users-table-header">

                    <div>
                        <h5>Users</h5>

                        <span>
                            Showing{" "}
                            {filteredUsers.length}{" "}
                            of{" "}
                            {users.length} users
                        </span>
                    </div>

                </div>

                <div className="table-responsive">

                    <table className="table users-table">

                        <thead>
                            <tr>
                                <th>#</th>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {filteredUsers.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="8"
                                        className="text-center py-5"
                                    >

                                        <div className="empty-users">

                                            <i className="bi bi-people"></i>

                                            <p>
                                                No users found
                                            </p>

                                        </div>

                                    </td>
                                </tr>

                            ) : (

                                filteredUsers.map(
                                    (user, index) => (

                                        <tr
                                            key={
                                                user._id
                                            }
                                        >

                                            <td>
                                                {index + 1}
                                            </td>

                                            <td>

                                                <div className="user-info">

                                                    <div className="user-avatar">

                                                        {user.fullName
                                                            ?.charAt(
                                                                0
                                                            )
                                                            ?.toUpperCase()}

                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                user.fullName
                                                            }
                                                        </strong>

                                                        {user.role ===
                                                            "super_admin" && (
                                                            <small>
                                                                Administrator
                                                            </small>
                                                        )}

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                {
                                                    user.email
                                                }
                                            </td>

                                            <td>

                                                <span
                                                    className={`role-badge role-${user.role}`}
                                                >
                                                    {getRoleLabel(
                                                        user.role
                                                    )}
                                                </span>

                                            </td>

                                            <td>
                                                {getCompanyName(
                                                    user.company
                                                )}
                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className={`status-badge ${
                                                        user.isActive
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                    onClick={() =>
                                                        handleStatusToggle(
                                                            user
                                                        )
                                                    }
                                                    disabled={
                                                        user.role ===
                                                        "super_admin"
                                                    }
                                                    title={
                                                        user.role ===
                                                        "super_admin"
                                                            ? "Super Admin status cannot be changed"
                                                            : user.isActive
                                                            ? "Click to deactivate"
                                                            : "Click to activate"
                                                    }
                                                >

                                                    <span className="status-dot"></span>

                                                    {user.isActive
                                                        ? "Active"
                                                        : "Inactive"}

                                                </button>

                                            </td>

                                            <td>

                                                {user.lastLogin
                                                    ? new Date(
                                                          user.lastLogin
                                                      ).toLocaleString(
                                                          "en-IN",
                                                          {
                                                              day: "2-digit",
                                                              month: "short",
                                                              year: "numeric",
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                          }
                                                      )
                                                    : "Never"}

                                            </td>

                                            <td>

                                                <div className="user-actions">

                                                    {user.role !==
                                                        "super_admin" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-primary"
                                                                title="Edit User"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        user
                                                                    )
                                                                }
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary"
                                                                title={
                                                                    user.isActive
                                                                        ? "Deactivate User"
                                                                        : "Activate User"
                                                                }
                                                                onClick={() =>
                                                                    handleStatusToggle(
                                                                        user
                                                                    )
                                                                }
                                                            >
                                                                <i
                                                                    className={`bi ${
                                                                        user.isActive
                                                                            ? "bi-person-x"
                                                                            : "bi-person-check"
                                                                    }`}
                                                                ></i>
                                                            </button>
                                                        </>
                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* ===============================
                Add / Edit User Modal
            =============================== */}

            {showModal && (

                <div
                    className="users-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >

                    <div className="users-modal">

                        <div className="users-modal-header">

                            <div>

                                <h4>
                                    {editingUser
                                        ? "Edit User"
                                        : "Add New User"}
                                </h4>

                                <p>
                                    {editingUser
                                        ? "Update user information and access"
                                        : "Create a new company user"}
                                </p>

                            </div>

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={closeModal}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>

                        <form
                            onSubmit={handleSubmit}
                        >

                            <div className="users-modal-body">

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

                                {/* Full Name */}

                                <div className="mb-3">

                                    <label className="form-label">
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="fullName"
                                        className="form-control"
                                        placeholder="Enter full name"
                                        value={
                                            form.fullName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            formLoading
                                        }
                                    />

                                </div>

                                {/* Email */}

                                <div className="mb-3">

                                    <label className="form-label">
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        placeholder="Enter email address"
                                        value={
                                            form.email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            formLoading
                                        }
                                    />

                                </div>

                                {/* Password */}

                                <div className="mb-3">

                                    <label className="form-label">

                                        Password

                                        {editingUser && (
                                            <small className="text-muted ms-2">
                                                Leave blank to keep current password
                                            </small>
                                        )}

                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control"
                                        placeholder={
                                            editingUser
                                                ? "Enter new password"
                                                : "Enter password"
                                        }
                                        value={
                                            form.password
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            formLoading
                                        }
                                    />

                                </div>

                                {/* Role + Company */}

                                <div className="row">

                                    <div className="col-md-6 mb-3">

                                        <label className="form-label">
                                            Role
                                        </label>

                                        <select
                                            name="role"
                                            className="form-select"
                                            value={
                                                form.role
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                formLoading
                                            }
                                        >

                                            <option value="">
                                                Select Role
                                            </option>

                                            <option value="employee">
                                                Employee
                                            </option>

                                            <option value="intern">
                                                Intern
                                            </option>

                                        </select>

                                    </div>

                                    <div className="col-md-6 mb-3">

                                        <label className="form-label">
                                            Company
                                        </label>

                                        <select
                                            name="company"
                                            className="form-select"
                                            value={
                                                form.company
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                formLoading
                                            }
                                        >

                                            <option value="">
                                                Select Company
                                            </option>

                                            {companies.map(
                                                (
                                                    company
                                                ) => (
                                                    <option
                                                        key={
                                                            company._id
                                                        }
                                                        value={
                                                            company._id
                                                        }
                                                    >
                                                        {
                                                            company.companyName
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                </div>

                                {/* Role Information */}

                                <div className="role-info-box">

                                    <i className="bi bi-info-circle"></i>

                                    <div>

                                        <strong>
                                            Role-based access
                                        </strong>

                                        <p>
                                            Employee and Intern users
                                            can manage leads and
                                            follow-ups. Their access
                                            to other modules depends
                                            on the assigned permissions.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* Modal Footer */}

                            <div className="users-modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        formLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        formLoading
                                    }
                                >

                                    {formLoading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                            ></span>

                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg me-2"></i>

                                            {editingUser
                                                ? "Update User"
                                                : "Create User"}
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

export default Users;