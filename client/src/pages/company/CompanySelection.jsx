import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./CompanySelection.css";

const CompanySelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/companies");

        setCompanies(response.data || []);
      } catch (err) {
        console.error("Failed to fetch companies:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load companies. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleCompanySelect = (companyId) => {
    navigate(`/dashboard/${companyId}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getCompanyDetails = (companyCode) => {
    const details = {
      MBT: {
        logo: "/logos/MBT.png",
        className: "logo-mbt",
        tagline: "Technology & Software Solutions",
        description: "Manage leads, projects and business operations.",
      },

      MSI: {
        logo: "/logos/MSI.png",
        className: "logo-msi",
        tagline: "Training & Skill Development",
        description: "Manage students, admissions, internships and training.",
      },

      MT: {
        logo: "/logos/MT.png",
        className: "logo-millionis",
        tagline: "Technology & Career Solutions",
        description: "Manage leads, placements and professional services.",
      },
    };

    return (
      details[companyCode] || {
        logo: "/logos/midbrains.png",
        className: "logo-default",
        tagline: "Business Management",
        description: "Manage your company operations.",
      }
    );
  };

  return (
    <div className="company-page">

      {/* ================= HEADER ================= */}
      <header className="company-header">
        <div className="brand-section">
          <div className="brand-icon">
            <i className="bi bi-grid-1x2-fill"></i>
          </div>

          <div>
            <h2>Follow-up CRM</h2>
            <p>Manage Leads&nbsp; | &nbsp;Track Progress&nbsp; | &nbsp;Grow Together</p>
          </div>
        </div>

        <div className="user-section">
          <div className="user-avatar">
            {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div className="user-info">
            <strong>{user?.fullName || "Admin"}</strong>
            <span>
              {user?.role === "super_admin"
                ? "Super Admin"
                : user?.role || "User"}
            </span>
          </div>

          <div className="header-divider"></div>

          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            Logout
          </button>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="company-main">

        {/* Heading */}
        <section className="company-heading">
          <span className="welcome-text">
            WELCOME TO FOLLOW-UP CRM
          </span>

          <h1>Select a Company</h1>

          <p>
            Choose the company you want to manage and access its dashboard.
          </p>

          <div className="heading-line">
            <span></span>
          </div>
        </section>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="state-box">
            <div className="spinner-border"></div>
            <p>Loading companies...</p>
          </div>
        )}

        {/* ================= ERROR ================= */}
        {!loading && error && (
          <div className="state-box error-box">
            <i className="bi bi-exclamation-circle"></i>
            <p>{error}</p>

            <button
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ================= COMPANY CARDS ================= */}
        {!loading && !error && companies.length > 0 && (
          <section className="company-grid">

            {companies.map((company) => {
              const details = getCompanyDetails(company.companyCode);

              return (
                <article
                  className={`company-card card-${company.companyCode?.toLowerCase()}`}
                  key={company._id}
                >

                  {/* Logo Area */}
                  <div className="company-logo-area">
                    <div className="logo-wrapper">
                      <img
                        src={details.logo}
                        alt={company.companyName}
                        className={`company-logo ${details.className}`}
                      />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="company-content">

                    <h3>{company.companyName}</h3>

                    <p className="company-tagline">
                      {details.tagline}
                    </p>

                    <p className="company-description">
                      {details.description}
                    </p>

                    <button
                      className="dashboard-btn"
                      onClick={() => handleCompanySelect(company._id)}
                    >
                      <span>Open Dashboard</span>
                      <i className="bi bi-arrow-right"></i>
                    </button>

                  </div>
                </article>
              );
            })}

          </section>
        )}

        {/* ================= EMPTY ================= */}
        {!loading && !error && companies.length === 0 && (
          <div className="state-box">
            <i className="bi bi-building"></i>
            <p>No companies available.</p>
          </div>
        )}

        {/* ================= FEATURES ================= */}
        {!loading && !error && companies.length > 0 && (
          <section className="feature-section">

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-bar-chart-fill"></i>
              </div>

              <div>
                <h4>Manage Leads</h4>
                <p>Keep track of your opportunities</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-people-fill"></i>
              </div>

              <div>
                <h4>Improve Follow-ups</h4>
                <p>Build stronger relationships</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-graph-up-arrow"></i>
              </div>

              <div>
                <h4>Grow Your Business</h4>
                <p>Achieve better results</p>
              </div>
            </div>

          </section>
        )}

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="company-footer">
        <span>
          © 2026 Follow-up CRM. All rights reserved.
        </span>

        <div className="footer-right">
          <span>
            <i className="bi bi-shield-check"></i>
            Secure
          </span>

          <b>|</b>

          <span>Reliable</span>

          <b>|</b>

          <span>Always Here for You</span>
        </div>
      </footer>

    </div>
  );
};

export default CompanySelection;