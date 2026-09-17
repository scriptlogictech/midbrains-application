
import { useEffect, useMemo, useState } from "react";
import {
  createWorkLog,
  getMyWorkLogs,
} from "../../services/workLogService";
import "./MyWork.css";

// -------------------- HELPERS --------------------

const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "";

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const difference = endTotalMinutes - startTotalMinutes;

  if (difference <= 0) return "";

  const hours = Math.floor(difference / 60);
  const minutes = difference % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;

  return `${hours} hr ${minutes} min`;
};

const calculateDurationInHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const difference = endTotalMinutes - startTotalMinutes;

  if (difference <= 0) return 0;

  return Number((difference / 60).toFixed(2));
};

const formatDate = (dateValue) => {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeValue) => {
  if (!timeValue) return "-";

  const [hours, minutes] = timeValue.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getLogDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getLogEmployeeName = (employee) => {
  if (!employee) return "You";

  if (typeof employee === "string") {
    return employee;
  }

  return (
    employee.fullName ||
    employee.name ||
    employee.email ||
    "You"
  );
};

const getDurationLabel = (log) => {
  if (typeof log.totalDuration === "number") {
    return `${log.totalDuration} hr`;
  }

  return (
    calculateDuration(log.startTime, log.endTime) || "-"
  );
};

const getWeekRange = () => {
  const today = new Date();

  const day = today.getDay();
  const differenceToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + differenceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayValue = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${dayValue}`;
  };

  return {
    start: format(monday),
    end: format(sunday),
  };
};

const getMonthRange = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const format = (date) => {
    const currentYear = date.getFullYear();
    const currentMonth = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${currentYear}-${currentMonth}-${day}`;
  };

  return {
    start: format(firstDay),
    end: format(lastDay),
  };
};

const initialForm = {
  workName: "",
  date: getToday(),
  startTime: "",
  endTime: "",
};

// -------------------- COMPONENT --------------------

const MyWork = () => {
  const [formData, setFormData] = useState(initialForm);

  const [workLogs, setWorkLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [historyFilter, setHistoryFilter] = useState("today");

  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());

  // -------------------- LOAD WORK LOGS --------------------

  const loadWorkLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyWorkLogs();

      setWorkLogs(response?.logs || []);
    } catch (err) {
      console.error("Get Work Logs Error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load your work details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkLogs();
  }, []);

  // -------------------- FORM DURATION --------------------

  const totalDuration = useMemo(() => {
    return calculateDuration(
      formData.startTime,
      formData.endTime
    );
  }, [formData.startTime, formData.endTime]);

  // -------------------- FILTER WORK LOGS --------------------

  const filteredLogs = useMemo(() => {
    let filterStartDate = "";
    let filterEndDate = "";

    if (historyFilter === "today") {
      filterStartDate = getToday();
      filterEndDate = getToday();
    }

    if (historyFilter === "week") {
      const weekRange = getWeekRange();

      filterStartDate = weekRange.start;
      filterEndDate = weekRange.end;
    }

    if (historyFilter === "month") {
      const monthRange = getMonthRange();

      filterStartDate = monthRange.start;
      filterEndDate = monthRange.end;
    }

    if (historyFilter === "custom") {
      filterStartDate = startDate;
      filterEndDate = endDate;
    }

    return [...workLogs]
      .filter((log) => {
        const logDate = getLogDate(log.date);

        if (!logDate) return false;

        if (historyFilter === "all") {
          return true;
        }

        if (!filterStartDate || !filterEndDate) {
          return true;
        }

        return (
          logDate >= filterStartDate &&
          logDate <= filterEndDate
        );
      })
      .sort((first, second) => {
        const firstDate = getLogDate(first.date);
        const secondDate = getLogDate(second.date);

        if (firstDate !== secondDate) {
          return secondDate.localeCompare(firstDate);
        }

        return String(first.startTime || "").localeCompare(
          String(second.startTime || "")
        );
      });
  }, [
    workLogs,
    historyFilter,
    startDate,
    endDate,
  ]);

  // -------------------- GROUP BY DATE --------------------

  const groupedHistory = useMemo(() => {
    const groupedData = {};

    filteredLogs.forEach((log) => {
      const dateKey = getLogDate(log.date);

      if (!dateKey) return;

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: log.date,
          workNames: [],
          startTimes: [],
          endTimes: [],
          totalHours: 0,
          employees: [],
        };
      }

      const currentDay = groupedData[dateKey];

      if (log.workName) {
        currentDay.workNames.push(log.workName);
      }

      if (log.startTime) {
        currentDay.startTimes.push(log.startTime);
      }

      if (log.endTime) {
        currentDay.endTimes.push(log.endTime);
      }

      const duration =
        typeof log.totalDuration === "number"
          ? log.totalDuration
          : calculateDurationInHours(
              log.startTime,
              log.endTime
            );

      currentDay.totalHours += duration;

      const employeeName = getLogEmployeeName(log.employee);

      if (!currentDay.employees.includes(employeeName)) {
        currentDay.employees.push(employeeName);
      }
    });

    return Object.values(groupedData)
      .map((day) => {
        const sortedStartTimes = [...day.startTimes].sort();
        const sortedEndTimes = [...day.endTimes].sort();

        return {
          ...day,
          earliestStart:
            sortedStartTimes.length > 0
              ? sortedStartTimes[0]
              : "",

          latestEnd:
            sortedEndTimes.length > 0
              ? sortedEndTimes[sortedEndTimes.length - 1]
              : "",

          totalHours: Number(day.totalHours.toFixed(2)),
        };
      })
      .sort((first, second) => {
        return getLogDate(second.date).localeCompare(
          getLogDate(first.date)
        );
      });
  }, [filteredLogs]);

  // -------------------- SUMMARY --------------------

  const totalHistoryHours = useMemo(() => {
    return groupedHistory.reduce((total, day) => {
      return total + day.totalHours;
    }, 0);
  }, [groupedHistory]);

  // -------------------- FORM HANDLERS --------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setFormData({
      ...initialForm,
      date: getToday(),
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const workName = formData.workName.trim();

    if (!workName) {
      setError("Please enter the work name.");
      return;
    }

    if (
      !formData.date ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setError("Please fill in all fields.");
      return;
    }

    const duration = calculateDuration(
      formData.startTime,
      formData.endTime
    );

    if (!duration) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setSaving(true);

      await createWorkLog({
        workName,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });

      setSuccess("Work details submitted successfully.");

      setHistoryFilter("custom");
      setStartDate(formData.date);
      setEndDate(formData.date);

      resetForm();

      await loadWorkLogs();
    } catch (err) {
      console.error("Create Work Log Error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to submit work details."
      );
    } finally {
      setSaving(false);
    }
  };

  // -------------------- UI --------------------

  return (
    <div className="my-work-page">
      <div className="my-work-header">
        <div>
          <h1>My Work</h1>
          <p>
            Enter your daily work details and view your work history.
          </p>
        </div>
      </div>

      {error && (
        <div className="form-message error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="form-message success-message">
          {success}
        </div>
      )}

      {/* -------------------- ADD WORK FORM -------------------- */}

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>Add Work Details</h2>
            <p>Fill in the work name, time and date.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="workName">Work Name</label>

            <input
              id="workName"
              name="workName"
              type="text"
              placeholder="e.g. React training, data entry, client call"
              value={formData.workName}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="date">Date</label>

              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startTime">
                Starting Time
              </label>

              <input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">
                Ending Time
              </label>

              <input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalDuration">
                Total Duration
              </label>

              <input
                id="totalDuration"
                type="text"
                value={
                  totalDuration || "Calculated automatically"
                }
                readOnly
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={resetForm}
              disabled={saving}
            >
              Clear
            </button>

            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
            >
              {saving ? "Submitting..." : "Submit Work"}
            </button>
          </div>
        </form>
      </section>

      {/* -------------------- WORK HISTORY -------------------- */}

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>My Daily Work History</h2>
            <p>
              All work entries from the same day are combined into one row.
            </p>
          </div>
        </div>

        {/* -------------------- FILTERS -------------------- */}

        <div className="work-filters">
          <div className="form-group">
            <label htmlFor="historyFilter">
              Filter History
            </label>

            <select
              id="historyFilter"
              value={historyFilter}
              onChange={(event) =>
                setHistoryFilter(event.target.value)
              }
            >
              <option value="today">Today</option>
              <option value="week">Current Week</option>
              <option value="month">Current Month</option>
              <option value="custom">Custom Range</option>
              <option value="all">All History</option>
            </select>
          </div>

          {historyFilter === "custom" && (
            <>
              <div className="form-group">
                <label htmlFor="startDate">
                  Start Date
                </label>

                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  End Date
                </label>

                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* -------------------- SUMMARY -------------------- */}

        <div className="work-summary-grid">
          <div className="work-summary-card">
            <div className="summary-icon">📅</div>

            <div>
              <span>Total Working Days</span>
              <strong>{groupedHistory.length}</strong>
            </div>
          </div>

          <div className="work-summary-card">
            <div className="summary-icon">📝</div>

            <div>
              <span>Total Work Entries</span>
              <strong>{filteredLogs.length}</strong>
            </div>
          </div>

          <div className="work-summary-card">
            <div className="summary-icon">⏱️</div>

            <div>
              <span>Total Hours</span>
              <strong>
                {totalHistoryHours.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        {/* -------------------- TABLE -------------------- */}

        {loading ? (
          <div className="my-work-loading">
            <div className="loading-spinner" />
            <p>Loading work details...</p>
          </div>
        ) : groupedHistory.length === 0 ? (
          <div className="empty-work">
            <h3>No work details found</h3>
            <p>
              Submit your work details to see your history here.
            </p>
          </div>
        ) : (
          <div className="work-history-table-wrapper">
            <table className="work-history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Work Details</th>
                  <th>Starting Time</th>
                  <th>Ending Time</th>
                  <th>Total Hours</th>
                </tr>
              </thead>

              <tbody>
                {groupedHistory.map((day, index) => (
                  <tr key={getLogDate(day.date)}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {formatDate(day.date)}
                      </strong>
                    </td>

                    <td>
                      {day.workNames.length > 0 ? (
                        <ul className="daily-work-list">
                          {day.workNames.map((workName, workIndex) => (
                            <li key={`${workName}-${workIndex}`}>
                              {workName}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      {formatTime(day.earliestStart)}
                    </td>

                    <td>
                      {formatTime(day.latestEnd)}
                    </td>

                    <td>
                      <strong>
                        {day.totalHours.toFixed(2)} hr
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyWork;