import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../../services/api";

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
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          title: "Total Leads",
          value: stats.totalLeads,
          icon: "bi-people-fill",
        },
        {
          title: "Pending Follow-ups",
          value: stats.pendingFollowUps,
          icon: "bi-calendar-check",
        },
        {
          title: "Converted Leads",
          value: stats.convertedLeads,
          icon: "bi-person-check-fill",
        },
        {
          title: "Revenue",
          value: `₹${Number(
            stats.revenue || 0
          ).toLocaleString("en-IN")}`,
          icon: "bi-currency-rupee",
        },
      ]
    : [];

  return (
    <div>

      {/* Page Header */}
      <div className="dashboard-page-header">

        <div>
          <h2>Dashboard</h2>

          <p>
            Welcome to your company dashboard
          </p>
        </div>

      </div>

      {/* Loading */}
      {loading && (
        <div className="dashboard-loading">

          <div
            className="spinner-border text-primary"
            role="status"
          ></div>

          <p>Loading dashboard...</p>

        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Dashboard */}
      {!loading && !error && stats && (

        <>
          {/* Company */}
          <div className="company-welcome-card">

            <div>
              <small>Currently Managing</small>

              <h3>
                {stats.companyName}
              </h3>
            </div>

            <div className="company-welcome-icon">
              <i className="bi bi-building"></i>
            </div>

          </div>

          {/* Stats */}
          <div className="row g-4 mt-2">

            {statCards.map((card) => (
              <div
                className="col-12 col-sm-6 col-xl-3"
                key={card.title}
              >

                <div className="dashboard-stat-card">

                  <div className="stat-card-content">

                    <div>
                      <p>{card.title}</p>

                      <h3>{card.value}</h3>
                    </div>

                    <div className="stat-icon">
                      <i className={`bi ${card.icon}`}></i>
                    </div>

                  </div>

                </div>

              </div>
            ))}

          </div>

          {/* Quick Access */}
          <div className="mt-5">

            <h5 className="section-title">
              Quick Access
            </h5>

            <div className="row g-4">

              <div className="col-12 col-md-6 col-lg-4">
                <QuickAccessCard
                  title="Manage Leads"
                  description="View and manage all company leads"
                  icon="bi-people-fill"
                  onClick={() =>
                    window.location.href =
                      `/dashboard/${companyId}/leads`
                  }
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <QuickAccessCard
                  title="Follow-ups"
                  description="Check today's and upcoming follow-ups"
                  icon="bi-calendar-check"
                  onClick={() =>
                    window.location.href =
                      `/dashboard/${companyId}/followups`
                  }
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <QuickAccessCard
                  title="Admissions"
                  description="Manage student admissions"
                  icon="bi-person-check-fill"
                  onClick={() =>
                    window.location.href =
                      `/dashboard/${companyId}/admissions`
                  }
                />
              </div>

            </div>

          </div>

        </>
      )}

    </div>
  );
};

const QuickAccessCard = ({
  title,
  description,
  icon,
  onClick,
}) => {
  return (
    <div
      className="quick-access-card"
      onClick={onClick}
    >

      <div className="quick-access-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <div>
        <h6>{title}</h6>

        <p>{description}</p>
      </div>

      <i className="bi bi-arrow-right quick-arrow"></i>

    </div>
  );
};

export default Dashboard;