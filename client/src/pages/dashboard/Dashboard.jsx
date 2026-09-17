
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../../services/api";

const START_HOUR = 10;
const END_HOUR = 18;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const Dashboard = () => {
  const { companyId } = useParams();

  const [stats, setStats] = useState(null);
  const [workLogs, setWorkLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logsError, setLogsError] = useState("");

  useEffect(() => {
    fetchStats();
  }, [companyId]);

  useEffect(() => {
    fetchWorkLogs();
  }, [companyId, selectedDate]);

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

  const fetchWorkLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");

      const response = await api.get("/work-logs", {
        params: {
          companyId,
          startDate: selectedDate,
          endDate: selectedDate,
        },
      });

      const logs = response.data?.workLogs || response.data || [];

      setWorkLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error("Work logs error:", error);

      setLogsError(
        error.response?.data?.message ||
          "Unable to load work reports."
      );

      setWorkLogs([]);
    } finally {
      setLogsLoading(false);
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

  const groupedLogs = useMemo(() => {
    const grouped = {};

    workLogs.forEach((log) => {
      const employeeId =
        log.employee?._id || log.employee || "unknown";

      const employeeName =
        log.employee?.name ||
        log.employee?.fullName ||
        log.employee?.email ||
        "Unknown Employee";

      if (!grouped[employeeId]) {
        grouped[employeeId] = {
          employeeId,
          employeeName,
          logs: [],
        };
      }

      grouped[employeeId].logs.push(log);
    });

    return Object.values(grouped);
  }, [workLogs]);

  const timeSlots = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, index) => START_HOUR + index
  );

  return (
    <div className="admin-dashboard">

      {/* Page Header */}
      <div className="dashboard-page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome to your company dashboard</p>
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

      {/* Dashboard Content */}
      {!loading && !error && stats && (
        <>
          {/* Company Welcome Card */}
          <div className="company-welcome-card">
            <div>
              <small>Currently Managing</small>

              <h3>{stats.companyName}</h3>
            </div>

            <div className="company-welcome-icon">
              <i className="bi bi-building"></i>
            </div>
          </div>

          {/* Statistics */}
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

          {/* Daily Work Report */}
          <div className="daily-work-report mt-5">
            <div className="work-report-header">
              <div>
                <h5 className="section-title">
                  Daily Work Report
                </h5>

                <p className="text-muted mb-0">
                  View employee work activities by time
                </p>
              </div>

              <div>
                <label
                  htmlFor="reportDate"
                  className="form-label"
                >
                  Select Date
                </label>

                <input
                  id="reportDate"
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(event.target.value)
                  }
                />
              </div>
            </div>

            {logsLoading && (
              <div className="text-center py-4">
                <div
                  className="spinner-border text-primary"
                  role="status"
                ></div>

                <p className="mt-2">
                  Loading work reports...
                </p>
              </div>
            )}

            {!logsLoading && logsError && (
              <div className="alert alert-danger mt-3">
                {logsError}
              </div>
            )}

            {!logsLoading &&
              !logsError &&
              groupedLogs.length === 0 && (
                <div className="alert alert-info mt-3">
                  No work logs found for this date.
                </div>
              )}

            {!logsLoading &&
              !logsError &&
              groupedLogs.length > 0 && (
                <div className="work-timeline-wrapper mt-4">
                  <div className="work-timeline">

                    {/* Time Header */}
                    <div className="timeline-time-header">
                      <div className="employee-column-header">
                        Employee
                      </div>

                      <div className="time-columns">
                        {timeSlots.map((hour) => (
                          <div
                            className="time-column"
                            key={hour}
                          >
                            {formatHour(hour)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Employee Rows */}
                    {groupedLogs.map((employee) => (
                      <div
                        className="timeline-employee-row"
                        key={employee.employeeId}
                      >
                        <div className="employee-name-column">
                          {employee.employeeName}
                        </div>

                        <div className="employee-work-area">
                          {/* Background Grid */}
                          <div className="timeline-grid">
                            {timeSlots.map((hour) => (
                              <div
                                className="timeline-grid-column"
                                key={hour}
                              ></div>
                            ))}
                          </div>

                          {/* Work Blocks */}
                          <div className="work-blocks">
                            {employee.logs.map((log) => (
                              <WorkBlock
                                key={log._id}
                                log={log}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    (window.location.href =
                      `/dashboard/${companyId}/leads`)
                  }
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <QuickAccessCard
                  title="Follow-ups"
                  description="Check today's and upcoming follow-ups"
                  icon="bi-calendar-check"
                  onClick={() =>
                    (window.location.href =
                      `/dashboard/${companyId}/followups`)
                  }
                />
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <QuickAccessCard
                  title="Admissions"
                  description="Manage student admissions"
                  icon="bi-person-check-fill"
                  onClick={() =>
                    (window.location.href =
                      `/dashboard/${companyId}/admissions`)
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

const WorkBlock = ({ log }) => {
  const startMinutes = convertTimeToMinutes(log.startTime);
  const endMinutes = convertTimeToMinutes(log.endTime);

  const left =
    ((startMinutes - START_HOUR * 60) / TOTAL_MINUTES) * 100;

  const width =
    ((endMinutes - startMinutes) / TOTAL_MINUTES) * 100;

  const safeLeft = Math.max(0, Math.min(left, 100));
  const safeWidth = Math.max(
    1,
    Math.min(width, 100 - safeLeft)
  );

  return (
    <div
      className="work-block"
      style={{
        left: `${safeLeft}%`,
        width: `${safeWidth}%`,
      }}
      title={`${log.workName} (${log.startTime} - ${log.endTime})`}
    >
      <strong>{log.workName}</strong>

      <small>
        {log.startTime} - {log.endTime}
      </small>
    </div>
  );
};

const convertTimeToMinutes = (time) => {
  if (!time || !time.includes(":")) return 0;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const formatHour = (hour) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour > 12 ? hour - 12 : hour;

  return `${formattedHour} ${suffix}`;
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