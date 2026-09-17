
import { useEffect, useMemo, useState } from "react";
import {
  createWorkLog,
  getMyWorkLogs,
} from "../../services/workLogService";
import "./MyWork.css";

// ========================================
// HELPERS
// ========================================

const getToday = () => {
  const today = new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const formatDateInput = (date) => {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "";

  const [startHours, startMinutes] = startTime
    .split(":")
    .map(Number);

  const [endHours, endMinutes] = endTime
    .split(":")
    .map(Number);

  const startTotalMinutes =
    startHours * 60 + startMinutes;

  const endTotalMinutes =
    endHours * 60 + endMinutes;

  const difference =
    endTotalMinutes - startTotalMinutes;

  if (difference <= 0) return "";

  const hours = Math.floor(difference / 60);
  const minutes = difference % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;

  return `${hours} hr ${minutes} min`;
};

const calculateDurationInHours = (
  startTime,
  endTime
) => {
  if (!startTime || !endTime) return 0;

  const [startHours, startMinutes] = startTime
    .split(":")
    .map(Number);

  const [endHours, endMinutes] = endTime
    .split(":")
    .map(Number);

  const startTotalMinutes =
    startHours * 60 + startMinutes;

  const endTotalMinutes =
    endHours * 60 + endMinutes;

  const difference =
    endTotalMinutes - startTotalMinutes;

  if (difference <= 0) return 0;

  return difference / 60;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeValue) => {
  if (!timeValue) return "-";

  const [hours, minutes] = timeValue
    .split(":")
    .map(Number);

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDurationLabel = (log) => {
  if (typeof log.totalDuration === "number") {
    return `${log.totalDuration} hr`;
  }

  return (
    calculateDuration(
      log.startTime,
      log.endTime
    ) || "-"
  );
};

const getLogDate = (dateValue) => {
  if (!dateValue) return "";

  // Handles ISO date values without timezone shifting
  return String(dateValue).substring(0, 10);
};

const getEmployeeName = (employee) => {
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

const getWeekRange = () => {
  const today = new Date();

  const day = today.getDay();

  // Monday = first day of week
  const difference =
    day === 0 ? -6 : 1 - day;

  const startDate = new Date(today);
  startDate.setDate(
    today.getDate() + difference
  );

  const endDate = new Date(startDate);
  endDate.setDate(
    startDate.getDate() + 6
  );

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
  };
};

const getMonthRange = () => {
  const today = new Date();

  const startDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const endDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
  };
};

const initialForm = {
  workName: "",
  date: getToday(),
  startTime: "",
  endTime: "",
};

// ========================================
// COMPONENT
// ========================================

const MyWork = () => {
  const [formData, setFormData] =
    useState(initialForm);

  const [workLogs, setWorkLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // History filter
  const [historyFilter, setHistoryFilter] =
    useState("today");

  const [startDate, setStartDate] =
    useState(getToday());

  const [endDate, setEndDate] =
    useState(getToday());

  // ========================================
  // LOAD WORK LOGS
  // ========================================

  const loadWorkLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getMyWorkLogs();

      setWorkLogs(response?.logs || []);
    } catch (err) {
      console.error(
        "Get Work Logs Error:",
        err
      );

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

  // ========================================
  // FORM DURATION
  // ========================================

  const totalDuration = useMemo(() => {
    return calculateDuration(
      formData.startTime,
      formData.endTime
    );
  }, [
    formData.startTime,
    formData.endTime,
  ]);

  // ========================================
  // HISTORY FILTER
  // ========================================

  const handleHistoryFilterChange = (
    event
  ) => {
    const value = event.target.value;

    setHistoryFilter(value);

    if (value === "today") {
      const today = getToday();

      setStartDate(today);
      setEndDate(today);
    }

    if (value === "week") {
      const range = getWeekRange();

      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }

    if (value === "month") {
      const range = getMonthRange();

      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }

    if (value === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  // ========================================
  // FILTERED HISTORY
  // ========================================

  const filteredLogs = useMemo(() => {
    return [...workLogs]
      .filter((log) => {
        const logDate = getLogDate(log.date);

        if (!logDate) return false;

        if (historyFilter === "all") {
          return true;
        }

        if (!startDate && !endDate) {
          return true;
        }

        if (
          startDate &&
          logDate < startDate
        ) {
          return false;
        }

        if (
          endDate &&
          logDate > endDate
        ) {
          return false;
        }

        return true;
      })
      .sort((first, second) => {
        const firstDate =
          getLogDate(first.date);

        const secondDate =
          getLogDate(second.date);

        if (firstDate !== secondDate) {
          return secondDate.localeCompare(
            firstDate
          );
        }

        return String(
          first.startTime || ""
        ).localeCompare(
          String(second.startTime || "")
        );
      });
  }, [
    workLogs,
    historyFilter,
    startDate,
    endDate,
  ]);

  // ========================================
  // HISTORY SUMMARY
  // ========================================

  const totalHistoryHours = useMemo(() => {
    return filteredLogs.reduce(
      (total, log) => {
        if (
          typeof log.totalDuration ===
          "number"
        ) {
          return total + log.totalDuration;
        }

        return (
          total +
          calculateDurationInHours(
            log.startTime,
            log.endTime
          )
        );
      },
      0
    );
  }, [filteredLogs]);

  // ========================================
  // FORM CHANGE
  // ========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ========================================
  // RESET FORM
  // ========================================

  const resetForm = () => {
    setFormData({
      ...initialForm,
      date: getToday(),
    });
  };

  // ========================================
  // SUBMIT WORK
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const workName =
      formData.workName.trim();

    if (!workName) {
      setError(
        "Please enter the work name."
      );
      return;
    }

    if (
      !formData.date ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setError(
        "Please fill in all fields."
      );
      return;
    }

    const duration = calculateDuration(
      formData.startTime,
      formData.endTime
    );

    if (!duration) {
      setError(
        "End time must be after start time."
      );
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

      setSuccess(
        "Work details submitted successfully."
      );

      setHistoryFilter("custom");
      setStartDate(formData.date);
      setEndDate(formData.date);

      resetForm();

      await loadWorkLogs();
    } catch (err) {
      console.error(
        "Create Work Log Error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to submit work details."
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="my-work-page">
      {/* HEADER */}

      <div className="my-work-header">
        <div>
          <h1>My Work</h1>

          <p>
            Add your daily work and view
            your work history.
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

      {/* ADD WORK SECTION */}

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>Add Work Details</h2>

            <p>
              Fill in your work name,
              date and working time.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="workName">
              Work Name
            </label>

            <input
              id="workName"
              name="workName"
              type="text"
              placeholder="e.g. React training, client call"
              value={formData.workName}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="date">
                Date
              </label>

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
                  totalDuration ||
                  "Calculated automatically"
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
              {saving
                ? "Submitting..."
                : "Submit Work"}
            </button>
          </div>
        </form>
      </section>

      {/* HISTORY SECTION */}

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>My Work History</h2>

            <p>
              View your daily, weekly and
              monthly work details.
            </p>
          </div>
        </div>

        {/* FILTERS */}

        <div className="history-filters">
          <div className="form-group">
            <label htmlFor="historyFilter">
              History Filter
            </label>

            <select
              id="historyFilter"
              value={historyFilter}
              onChange={
                handleHistoryFilterChange
              }
            >
              <option value="today">
                Today
              </option>

              <option value="week">
                Current Week
              </option>

              <option value="month">
                Current Month
              </option>

              <option value="custom">
                Custom Date Range
              </option>

              <option value="all">
                All History
              </option>
            </select>
          </div>

          {(historyFilter === "custom" ||
            historyFilter === "all") && (
            <>
              <div className="form-group">
                <label htmlFor="startDate">
                  Start Date
                </label>

                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(
                      event.target.value
                    );
                    setHistoryFilter(
                      "custom"
                    );
                  }}
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
                  onChange={(event) => {
                    setEndDate(
                      event.target.value
                    );
                    setHistoryFilter(
                      "custom"
                    );
                  }}
                />
              </div>
            </>
          )}

          {historyFilter !== "all" &&
            historyFilter !== "custom" && (
              <div className="history-date-range">
                <span>Selected Range</span>

                <strong>
                  {startDate || "-"} to{" "}
                  {endDate || "-"}
                </strong>
              </div>
            )}
        </div>

        {/* SUMMARY */}

        <div className="work-summary-grid">
          <div className="work-summary-card">
            <div className="summary-icon">
              📝
            </div>

            <div>
              <span>Total Work Entries</span>

              <strong>
                {filteredLogs.length}
              </strong>
            </div>
          </div>

          <div className="work-summary-card">
            <div className="summary-icon">
              ⏱️
            </div>

            <div>
              <span>Total Hours</span>

              <strong>
                {totalHistoryHours.toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        {/* TABLE */}

        {loading ? (
          <div className="my-work-loading">
            <div className="loading-spinner" />

            <p>
              Loading work history...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-work">
            <h3>
              No work history found
            </h3>

            <p>
              No work entries are available
              for the selected period.
            </p>
          </div>
        ) : (
          <div className="work-table-wrapper">
            <table className="work-history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Work Name</th>
                  <th>Starting Time</th>
                  <th>Ending Time</th>
                  <th>Total Duration</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map(
                  (log, index) => (
                    <tr
                      key={
                        log._id ||
                        `${log.date}-${index}`
                      }
                    >
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {formatDate(
                          log.date
                        )}
                      </td>

                      <td className="work-name-cell">
                        {log.workName ||
                          "Work Entry"}
                      </td>

                      <td>
                        {formatTime(
                          log.startTime
                        )}
                      </td>

                      <td>
                        {formatTime(
                          log.endTime
                        )}
                      </td>

                      <td>
                        <span className="duration-badge">
                          {getDurationLabel(
                            log
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyWork;