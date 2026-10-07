import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../services/api";
import "./Dashboard.css";

const Dashboard = () => {
  const { companyId } = useParams();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, [companyId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/companies/${companyId}/stats`
      );

      setStats(response.data);
    } catch (error) {
      console.error("Dashboard error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  const formatCurrency = (value) => {
    return `₹${formatNumber(value)}`;
  };

  const statCards = stats
    ? [
        {
          title: "Total Leads",
          value: formatNumber(stats.totalLeads),
          icon: "bi-people-fill",
          type: "blue",
          description: "All company leads",
        },
        {
          title: "Pending Follow-ups",
          value: formatNumber(stats.pendingFollowUps),
          icon: "bi-calendar-check-fill",
          type: "orange",
          description: "Follow-ups to complete",
        },
        {
          title: "Converted Leads",
          value: formatNumber(stats.convertedLeads),
          icon: "bi-person-check-fill",
          type: "green",
          description: "Successfully converted",
        },
        {
          title: "Revenue",
          value: formatCurrency(stats.revenue),
          icon: "bi-currency-rupee",
          type: "purple",
          description: "Total recorded revenue",
        },
      ]
    : [];

  const quickActions = [
    {
      title: "Manage Leads",
      description: "View, add and manage company leads",
      icon: "bi-people-fill",
      path: `/dashboard/${companyId}/leads`,
      type: "blue",
    },
    {
      title: "Follow-ups",
      description: "Check today's and upcoming follow-ups",
      icon: "bi-calendar-check-fill",
      path: `/dashboard/${companyId}/followups`,
      type: "orange",
    },
    {
      title: "Admissions",
      description: "Manage student admissions",
      icon: "bi-person-check-fill",
      path: `/dashboard/${companyId}/admissions`,
      type: "green",
    },
    {
      title: "Reports",
      description: "View company performance reports",
      icon: "bi-bar-chart-fill",
      path: `/dashboard/${companyId}/reports`,
      type: "purple",
    },
  ];

  return (
    <div className="modern-dashboard">

      {/* =========================================
          HEADER
      ========================================= */}

      <section className="dashboard-hero">

        <div className="dashboard-hero-content">

          <div className="dashboard-eyebrow">
            <span className="live-dot"></span>
            CRM OVERVIEW
          </div>

          <h1>
            Good to see you!
          </h1>

          <p>
            Here is what is happening with your company today.
          </p>

        </div>

        <button
          type="button"
          className="refresh-dashboard-btn"
          onClick={fetchStats}
          disabled={loading}
        >
          <i
            className={`bi bi-arrow-clockwise ${
              loading ? "spin" : ""
            }`}
          ></i>

          Refresh
        </button>

      </section>


      {/* =========================================
          LOADING
      ========================================= */}

      {loading && (
        <div className="dashboard-loading-card">

          <div className="dashboard-spinner"></div>

          <h5>
            Loading your dashboard
          </h5>

          <p>
            Fetching the latest company statistics...
          </p>

        </div>
      )}


      {/* =========================================
          ERROR
      ========================================= */}

      {!loading && error && (
        <div className="dashboard-error-card">

          <div className="error-icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>

          <div className="error-content">

            <h5>
              Unable to load dashboard
            </h5>

            <p>
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={fetchStats}
          >
            Try Again
          </button>

        </div>
      )}


      {/* =========================================
          MAIN DASHBOARD
      ========================================= */}

      {!loading && !error && stats && (
        <>

          {/* =====================================
              COMPANY BANNER
          ===================================== */}

          <section className="company-banner">

            <div className="company-banner-left">

              <div className="company-banner-icon">
                <i className="bi bi-building-fill"></i>
              </div>

              <div className="company-banner-content">

                <span>
                  CURRENTLY MANAGING
                </span>

                <h2>
                  {stats.companyName || "Company"}
                </h2>

                <p>
                  Your company CRM workspace
                </p>

              </div>

            </div>


            <div className="company-banner-status">

              <span className="status-dot"></span>

              Active

            </div>


            <div className="company-decoration decoration-one"></div>
            <div className="company-decoration decoration-two"></div>

          </section>


          {/* =====================================
              BUSINESS OVERVIEW
          ===================================== */}

          <section className="dashboard-section">

            <div className="section-heading-row">

              <div>

                <span className="section-kicker">
                  PERFORMANCE
                </span>

                <h3>
                  Business Overview
                </h3>

              </div>

              <span className="updated-badge">

                <i className="bi bi-broadcast-pin"></i>

                Live data

              </span>

            </div>


            <div className="dashboard-stat-grid">

              {statCards.map((card) => (

                <div
                  className="dashboard-stat-card"
                  key={card.title}
                >

                  <div
                    className={`stat-icon-wrap ${card.type}`}
                  >
                    <i
                      className={`bi ${card.icon}`}
                    ></i>
                  </div>


                  <div className="stat-card-top">

                    <span>
                      {card.title}
                    </span>

                    <i className="bi bi-three-dots"></i>

                  </div>


                  <h3>
                    {card.value}
                  </h3>


                  <div className="stat-card-footer">

                    <span className="stat-status">

                      <i className="bi bi-check-circle-fill"></i>

                      Active

                    </span>

                    <span>
                      {card.description}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          </section>


          {/* =====================================
              QUICK ACCESS
          ===================================== */}

          <section className="dashboard-section">

            <div className="section-heading-row">

              <div>

                <span className="section-kicker">
                  SHORTCUTS
                </span>

                <h3>
                  Quick Access
                </h3>

              </div>

              <span className="quick-hint">
                Choose a module to get started
              </span>

            </div>


            <div className="quick-access-grid">

              {quickActions.map((action) => (

                <Link
                  to={action.path}
                  className="quick-access-card"
                  key={action.title}
                >

                  <div
                    className={`quick-access-icon ${action.type}`}
                  >

                    <i
                      className={`bi ${action.icon}`}
                    ></i>

                  </div>


                  <div className="quick-access-content">

                    <h5>
                      {action.title}
                    </h5>

                    <p>
                      {action.description}
                    </p>

                  </div>


                  <div className="quick-access-arrow">

                    <i className="bi bi-arrow-up-right"></i>

                  </div>

                </Link>

              ))}

            </div>

          </section>


          {/* =====================================
              INFORMATION CARDS
          ===================================== */}

          <section className="dashboard-bottom-grid">

            <div className="dashboard-info-card">

              <div className="info-card-icon orange">

                <i className="bi bi-lightning-charge-fill"></i>

              </div>

              <div>

                <span>
                  CRM TIP
                </span>

                <h4>
                  Stay on top of your follow-ups
                </h4>

                <p>
                  Regular follow-ups help your team
                  convert more leads and maintain better
                  customer relationships.
                </p>

              </div>

            </div>


            <div className="dashboard-info-card">

              <div className="info-card-icon purple">

                <i className="bi bi-graph-up-arrow"></i>

              </div>

              <div>

                <span>
                  INSIGHT
                </span>

                <h4>
                  Keep your data updated
                </h4>

                <p>
                  Accurate lead and follow-up data gives
                  you a clearer picture of your company
                  performance.
                </p>

              </div>

            </div>

          </section>

        </>
      )}

    </div>
  );
};

export default Dashboard;