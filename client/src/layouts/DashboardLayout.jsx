import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = ({ children }) => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ==========================================
  // Role Based Menu Access
  // ==========================================

  const menuItems = [
    {
      label: "Dashboard",
      icon: "bi-grid-1x2-fill",
      path: `/dashboard/${companyId}`,
      roles: [
        "super_admin",
        "counselor",
        "hr",
        "trainer",
        "placement_coordinator",
        "project_manager",
      ],
    },
    {
      label: "Leads",
      icon: "bi-people-fill",
      path: `/dashboard/${companyId}/leads`,
      roles: ["super_admin", "counselor"],
    },
    {
      label: "Follow-ups",
      icon: "bi-calendar-check",
      path: `/dashboard/${companyId}/followups`,
      roles: ["super_admin", "counselor"],
    },
    {
      label: "Admissions",
      icon: "bi-person-check-fill",
      path: `/dashboard/${companyId}/admissions`,
      roles: ["super_admin", "counselor"],
    },
    {
      label: "Internships",
      icon: "bi-mortarboard-fill",
      path: `/dashboard/${companyId}/internships`,
      roles: ["super_admin", "trainer"],
    },
    {
      label: "Corporate Training",
      icon: "bi-building-fill",
      path: `/dashboard/${companyId}/corporate-training`,
      roles: ["super_admin", "trainer"],
    },
    {
      label: "Projects",
      icon: "bi-kanban-fill",
      path: `/dashboard/${companyId}/projects`,
      roles: ["super_admin", "project_manager"],
    },
    {
      label: "Placements",
      icon: "bi-briefcase-fill",
      path: `/dashboard/${companyId}/placements`,
      roles: ["super_admin", "placement_coordinator"],
    },
    {
      label: "Reports",
      icon: "bi-bar-chart-fill",
      path: `/dashboard/${companyId}/reports`,
      roles: ["super_admin"],
    },
    {
      label: "User Management",
      icon: "bi-person-gear",
      path: `/dashboard/${companyId}/users`,
      roles: ["super_admin"],
    },
  ];

  // ==========================================
  // Filter Menu According To User Role
  // ==========================================

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="dashboard-wrapper">

      {/* ==========================================
          Mobile Overlay
      ========================================== */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ==========================================
          Sidebar
      ========================================== */}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        {/* Brand */}

        <div className="sidebar-brand">

          <div className="brand-icon">
            <i className="bi bi-grid-1x2-fill"></i>
          </div>

          <div>
            <h5>Follow-up CRM</h5>
            <small>Management System</small>
          </div>

        </div>

        {/* Menu */}

        <div className="sidebar-menu">

          <div className="menu-heading">
            MAIN MENU
          </div>

          {visibleMenuItems.map((item) => (

            <button
              key={item.label}
              className="sidebar-menu-item"
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            >

              <i className={`bi ${item.icon}`}></i>

              <span>{item.label}</span>

            </button>

          ))}

        </div>

        {/* ==========================================
            Sidebar Bottom
        ========================================== */}

        <div className="sidebar-bottom">

          <button
            className="sidebar-menu-item"
            onClick={() => navigate("/companies")}
          >
            <i className="bi bi-arrow-left-circle"></i>

            <span>Change Company</span>
          </button>

          <button
            className="sidebar-menu-item logout-item"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>

            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* ==========================================
          Main Area
      ========================================== */}

      <div className="dashboard-main">

        {/* Topbar */}

        <header className="dashboard-topbar">

          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <i className="bi bi-list"></i>
          </button>

          <div className="topbar-user">

            <div className="user-avatar">
              {user?.fullName
                ?.charAt(0)
                ?.toUpperCase() || "A"}
            </div>

            <div className="user-info">

              <strong>
                {user?.fullName}
              </strong>

              <small>
                {user?.role === "super_admin"
                  ? "Super Admin"
                  : user?.role}
              </small>

            </div>

          </div>

        </header>

        {/* Page Content */}

        <main className="dashboard-content">
          {children}
        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;