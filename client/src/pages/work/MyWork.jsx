
import { useEffect, useMemo, useState } from "react";

import {
  createWorkLog,
  getMyWorkLogs,
  updateWorkLog,
  deleteWorkLog,
} from "../../services/workLogService";

import "./MyWork.css";

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .split("T")[0];
};

const getDateString = (value) => {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.substring(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  if (end <= start) return "";

  return end - start;
};

const MyWork = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filter, setFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  const [formData, setFormData] = useState({
    date: getToday(),
    work: "",
    startTime: "",
    endTime: "",
  });

  // ============================================================
  // FETCH WORK LOGS
  // ============================================================

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyWorkLogs();

      setLogs(response?.logs || []);
    } catch (err) {
      console.error("Fetch work logs error:", err);

      setError(
        err.response?.data?.message || "Failed to fetch work logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingLog(null);

    setFormData({
      date: getToday(),
      work: "",
      startTime: "",
      endTime: "",
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);

    setFormData({
      date: getToday(),
      work: "",
      startTime: "",
      endTime: "",
    });
  };

  // ============================================================
  // CREATE / UPDATE WORK LOG
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const workDescription = formData.work.trim();

    if (!formData.date || !workDescription) {
      setError("Date and work description are required.");
      return;
    }

    if (
      formData.startTime &&
      formData.endTime &&
      formData.endTime <= formData.startTime
    ) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        date: formData.date,
        work: workDescription,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      if (editingLog) {
        const id = editingLog._id || editingLog.id;

        await updateWorkLog(id, payload);

        setSuccess("Work log updated successfully.");
      } else {
        await createWorkLog(payload);

        setSuccess("Work log added successfully.");
      }

      closeModal();
      await fetchLogs();
    } catch (err) {
      console.error("Save work log error:", err);

      setError(
        err.response?.data?.message || "Failed to save work log."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // EDIT WORK LOG
  // ============================================================

  const handleEdit = (log) => {
    setEditingLog(log);

    setFormData({
      date: getDateString(log.date),
      work: log.work || log.description || log.task || "",
      startTime: log.startTime || "",
      endTime: log.endTime || "",
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // ============================================================
  // DELETE WORK LOG
  // ============================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this work log?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteWorkLog(id);

      setLogs((previousLogs) =>
        previousLogs.filter((log) => (log._id || log.id) !== id)
      );

      setSuccess("Work log deleted successfully.");
    } catch (err) {
      console.error("Delete work log error:", err);

      setError(
        err.response?.data?.message || "Failed to delete work log."
      );
    }
  };

  // ============================================================
  // DATE FILTER HELPERS
  // ============================================================

  const getWeekStart = () => {
    const date = new Date();
    const day = date.getDay();

    const difference = day === 0 ? -6 : 1 - day;

    date.setDate(date.getDate() + difference);

    return getDateString(date);
  };

  const getMonthStart = () => {
    const date = new Date();

    return getDateString(
      new Date(date.getFullYear(), date.getMonth(), 1)
    );
  };

  // ============================================================
  // FILTER LOGS
  // ============================================================

  const filteredLogs = useMemo(() => {
    const today = getToday();
    const weekStart = getWeekStart();
    const monthStart = getMonthStart();

    return logs.filter((log) => {
      const logDate = getDateString(log.date);

      if (filter === "today") {
        return logDate === today;
      }

      if (filter === "week") {
        return logDate >= weekStart && logDate <= today;
      }

      if (filter === "month") {
        return logDate >= monthStart && logDate <= today;
      }

      if (filter === "custom") {
        return logDate === customDate;
      }

      return true;
    });
  }, [logs, filter, customDate]);

  // ============================================================
  // GROUP LOGS BY DATE
  // ============================================================

  const groupedLogs = useMemo(() => {
    const groups = {};

    filteredLogs.forEach((log) => {
      const date = getDateString(log.date);

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(log);
    });

    return Object.entries(groups).sort(
      ([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  }, [filteredLogs]);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="my-work-container">
      {/* HEADER */}

      <div className="my-work-header">
        <div>
          <h2>My Work</h2>
          <p>Track and manage your daily work activities.</p>
        </div>

        <button
          type="button"
          className="add-work-btn"
          onClick={openAddModal}
        >
          + Add Work
        </button>
      </div>

      {/* ALERTS */}

      {error && <div className="error-message">{error}</div>}

      {success && (
        <div className="success-message">{success}</div>
      )}

      {/* FILTERS */}

      <div className="work-filters">
        <button
          type="button"
          className={filter === "today" ? "active-filter" : ""}
          onClick={() => setFilter("today")}
        >
          Today
        </button>

        <button
          type="button"
          className={filter === "week" ? "active-filter" : ""}
          onClick={() => setFilter("week")}
        >
          This Week
        </button>

        <button
          type="button"
          className={filter === "month" ? "active-filter" : ""}
          onClick={() => setFilter("month")}
        >
          This Month
        </button>

        <button
          type="button"
          className={filter === "all" ? "active-filter" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          type="button"
          className={filter === "custom" ? "active-filter" : ""}
          onClick={() => setFilter("custom")}
        >
          Custom Date
        </button>

        {filter === "custom" && (
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
        )}
      </div>

      {/* WORK TABLE */}

      {loading ? (
        <p className="loading-text">Loading work logs...</p>
      ) : groupedLogs.length === 0 ? (
        <div className="empty-work">
          <p>No work logs found.</p>

          <button
            type="button"
            className="add-work-btn"
            onClick={openAddModal}
          >
            + Add Your First Work
          </button>
        </div>
      ) : (
        <div className="work-table-wrapper">
          <table className="work-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Work Activity</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {groupedLogs.map(([date, dailyLogs]) =>
                dailyLogs.map((log, index) => {
                  const id = log._id || log.id;

                  const duration =
                    log.duration ??
                    calculateDuration(
                      log.startTime,
                      log.endTime
                    );

                  return (
                    <tr key={id}>
                      {index === 0 && (
                        <td rowSpan={dailyLogs.length}>
                          <strong>{formatDate(date)}</strong>
                        </td>
                      )}

                      <td>
                        {log.work ||
                          log.description ||
                          log.task ||
                          "N/A"}
                      </td>

                      <td>{log.startTime || "-"}</td>

                      <td>{log.endTime || "-"}</td>

                      <td>
                        {duration !== "" &&
                        duration !== null &&
                        duration !== undefined
                          ? `${duration} minutes`
                          : "-"}
                      </td>

                      <td>
                        <div className="work-actions">
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => handleEdit(log)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDelete(id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="work-modal">
            <div className="modal-header">
              <h3>
                {editingLog ? "Edit Work Log" : "Add Work Log"}
              </h3>

              <button
                type="button"
                className="close-modal-btn"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* DATE */}

              <div className="form-group">
                <label htmlFor="date">Date</label>

                <input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* WORK DESCRIPTION */}

              <div className="form-group">
                <label htmlFor="work">Work Description</label>

                <textarea
                  id="work"
                  name="work"
                  value={formData.work}
                  onChange={handleChange}
                  placeholder="Enter your work activity"
                  rows="4"
                  required
                />
              </div>

              {/* TIME */}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>

                  <input
                    id="startTime"
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>

                  <input
                    id="endTime"
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* ACTIONS */}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingLog
                    ? "Update Work"
                    : "Save Work"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWork;