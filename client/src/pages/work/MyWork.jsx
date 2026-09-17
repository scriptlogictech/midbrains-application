
import { useEffect, useMemo, useState } from "react";
import {
  createWorkLog,
  getMyWorkLogs,
  updateWorkLog,
  deleteWorkLog,
} from "../../services/workLogService";
import "./MyWork.css";

// Get today's date in YYYY-MM-DD format
const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
};

// Convert date into YYYY-MM-DD format
const getDateString = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue).split("T")[0];
  }

  return date.toISOString().split("T")[0];
};

// Calculate duration between two times
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "-";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  const difference = endTotalMinutes - startTotalMinutes;

  if (difference <= 0) return "-";

  const hours = Math.floor(difference / 60);
  const minutes = difference % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
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
    workName: "",
    startTime: "",
    endTime: "",
  });

  // Fetch current user's work logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyWorkLogs();

      setLogs(response?.logs || []);
    } catch (err) {
      console.error("Error fetching work logs:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to fetch work history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // Open add-work modal
  const handleOpenAddModal = () => {
    setEditingLog(null);

    setFormData({
      date: getToday(),
      workName: "",
      startTime: "",
      endTime: "",
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // Close modal and reset form
  const resetForm = () => {
    setIsModalOpen(false);
    setEditingLog(null);

    setFormData({
      date: getToday(),
      workName: "",
      startTime: "",
      endTime: "",
    });
  };

  // Submit create/update form
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Validate workName
    if (!formData.workName.trim()) {
      setError("Work name is required.");
      return;
    }

    if (!formData.date) {
      setError("Date is required.");
      return;
    }

    if (!formData.startTime) {
      setError("Start time is required.");
      return;
    }

    if (!formData.endTime) {
      setError("End time is required.");
      return;
    }

    if (formData.endTime <= formData.startTime) {
      setError("End time must be greater than start time.");
      return;
    }

    try {
      setSubmitting(true);

      if (editingLog) {
        const logId = editingLog._id || editingLog.id;

        await updateWorkLog(logId, {
          date: formData.date,
          workName: formData.workName.trim(),
          startTime: formData.startTime,
          endTime: formData.endTime,
        });

        setSuccess("Work updated successfully.");
      } else {
        await createWorkLog({
          date: formData.date,
          workName: formData.workName.trim(),
          startTime: formData.startTime,
          endTime: formData.endTime,
        });

        setSuccess("Work added successfully.");
      }

      resetForm();
      await fetchLogs();
    } catch (err) {
      console.error("Error saving work log:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save work log."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Edit work log
  const handleEdit = (log) => {
    setEditingLog(log);

    setFormData({
      date: getDateString(log.date),
      workName: log.workName || "",
      startTime: log.startTime || "",
      endTime: log.endTime || "",
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // Delete work log
  const handleDelete = async (log) => {
    const logId = log._id || log.id;

    const confirmed = window.confirm(
      "Are you sure you want to delete this work entry?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteWorkLog(logId);

      setLogs((previousLogs) =>
        previousLogs.filter(
          (item) => (item._id || item.id) !== logId
        )
      );

      setSuccess("Work deleted successfully.");
    } catch (err) {
      console.error("Error deleting work log:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to delete work log."
      );
    }
  };

  // Filter logs by date
  const filteredLogs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return logs.filter((log) => {
      const logDateString = getDateString(log.date);

      if (!logDateString) return false;

      const logDate = new Date(`${logDateString}T00:00:00`);
      logDate.setHours(0, 0, 0, 0);

      if (filter === "all") {
        return true;
      }

      if (filter === "today") {
        return logDate.getTime() === today.getTime();
      }

      if (filter === "week") {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return logDate >= weekStart && logDate <= weekEnd;
      }

      if (filter === "month") {
        return (
          logDate.getMonth() === today.getMonth() &&
          logDate.getFullYear() === today.getFullYear()
        );
      }

      if (filter === "custom") {
        return logDateString === customDate;
      }

      return true;
    });
  }, [logs, filter, customDate]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const grouped = {};

    filteredLogs.forEach((log) => {
      const date = getDateString(log.date);

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(log);
    });

    return Object.entries(grouped).sort(
      ([dateA], [dateB]) =>
        new Date(dateB) - new Date(dateA)
    );
  }, [filteredLogs]);

  // Format date for display
  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(`${getDateString(dateValue)}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="my-work-container">
      {/* Header */}
      <div className="my-work-header">
        <div>
          <h1>My Work</h1>
          <p>Track and manage your daily work activities.</p>
        </div>

        <button
          type="button"
          className="add-work-btn"
          onClick={handleOpenAddModal}
        >
          + Add Work
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert error-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert success-alert">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="work-filters">
        <button
          type="button"
          className={filter === "all" ? "active" : ""}
          onClick={() => {
            setFilter("all");
            setCustomDate("");
          }}
        >
          All
        </button>

        <button
          type="button"
          className={filter === "today" ? "active" : ""}
          onClick={() => {
            setFilter("today");
            setCustomDate("");
          }}
        >
          Today
        </button>

        <button
          type="button"
          className={filter === "week" ? "active" : ""}
          onClick={() => {
            setFilter("week");
            setCustomDate("");
          }}
        >
          This Week
        </button>

        <button
          type="button"
          className={filter === "month" ? "active" : ""}
          onClick={() => {
            setFilter("month");
            setCustomDate("");
          }}
        >
          This Month
        </button>

        <button
          type="button"
          className={filter === "custom" ? "active" : ""}
          onClick={() => setFilter("custom")}
        >
          Custom Date
        </button>

        {filter === "custom" && (
          <input
            type="date"
            value={customDate}
            onChange={(event) =>
              setCustomDate(event.target.value)
            }
          />
        )}
      </div>

      {/* Work History */}
      <div className="work-history-card">
        <div className="work-history-heading">
          <h2>Work History</h2>
          <span>{filteredLogs.length} entries</span>
        </div>

        {loading ? (
          <div className="loading-state">
            Loading work history...
          </div>
        ) : groupedLogs.length === 0 ? (
          <div className="empty-state">
            <h3>No work records found</h3>
            <p>Add your daily work activity to see it here.</p>

            <button
              type="button"
              className="add-work-btn"
              onClick={handleOpenAddModal}
            >
              + Add Work
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="work-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Work Name</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {groupedLogs.map(([date, dateLogs]) =>
                  dateLogs.map((log, index) => {
                    const logId = log._id || log.id;

                    return (
                      <tr key={logId}>
                        <td>
                          {index === 0 ? formatDate(date) : ""}
                        </td>

                        <td className="work-name-cell">
                          {log.workName || "-"}
                        </td>

                        <td>{log.startTime || "-"}</td>

                        <td>{log.endTime || "-"}</td>

                        <td>
                          {calculateDuration(
                            log.startTime,
                            log.endTime
                          )}
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
                              onClick={() => handleDelete(log)}
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
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="work-modal">
            <div className="modal-header">
              <h2>
                {editingLog ? "Edit Work" : "Add Work"}
              </h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
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

              <div className="form-group">
                <label htmlFor="workName">Work Name</label>

                <input
                  id="workName"
                  type="text"
                  name="workName"
                  value={formData.workName}
                  onChange={handleChange}
                  placeholder="Enter work name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>

                  <input
                    id="startTime"
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
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
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                  disabled={submitting}
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