
import { useEffect, useMemo, useState } from "react";

import {
  createWorkLog,
  getMyWorkLogs,
  updateWorkLog,
  deleteWorkLog,
} from "../../services/workLogService";

import "./MyWork.css";

/* ================================
   HELPER FUNCTIONS
================================ */

const getToday = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateKey = (dateValue) => {
  if (!dateValue) return "";

  if (typeof dateValue === "string") {
    const datePart = dateValue.substring(0, 10);

    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "-";

  const date = new Date(`${dateValue}T00:00:00`);

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

  const [hours, minutes] = timeValue.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeValue;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

const getLogDurationInHours = (log) => {
  if (typeof log.totalDuration === "number") {
    return log.totalDuration;
  }

  if (typeof log.totalDuration === "string") {
    const duration = Number(log.totalDuration);

    if (!Number.isNaN(duration)) {
      return duration;
    }
  }

  return calculateDurationInHours(
    log.startTime,
    log.endTime
  );
};

const getEarliestTime = (logs, field) => {
  const times = logs
    .map((log) => log[field])
    .filter(Boolean)
    .sort();

  return times[0] || "";
};

const getLatestTime = (logs, field) => {
  const times = logs
    .map((log) => log[field])
    .filter(Boolean)
    .sort();

  return times[times.length - 1] || "";
};

/* ================================
   INITIAL FORM
================================ */

const initialForm = {
  workName: "",
  date: getToday(),
  startTime: "",
  endTime: "",
};

/* ================================
   COMPONENT
================================ */

const MyWork = () => {
  const [formData, setFormData] = useState(initialForm);

  const [workLogs, setWorkLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [historyFilter, setHistoryFilter] = useState("today");

  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());

  const [editingWork, setEditingWork] = useState(null);

  const [editForm, setEditForm] = useState({
    workName: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  /* ================================
     LOAD WORK LOGS
  ================================ */

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

  /* ================================
     FORM HANDLERS
  ================================ */

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
  };

  const totalDuration = useMemo(() => {
    return calculateDuration(
      formData.startTime,
      formData.endTime
    );
  }, [formData.startTime, formData.endTime]);

  /* ================================
     CREATE WORK
  ================================ */

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

      setHistoryFilter("today");
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

  /* ================================
     FILTER HISTORY
  ================================ */

  const filteredLogs = useMemo(() => {
    const today = getToday();

    const todayDate = new Date(`${today}T00:00:00`);

    let rangeStart = "";
    let rangeEnd = "";

    if (historyFilter === "today") {
      rangeStart = today;
      rangeEnd = today;
    }

    if (historyFilter === "week") {
      const day = todayDate.getDay();

      const mondayOffset = day === 0 ? 6 : day - 1;

      const weekStart = new Date(todayDate);
      weekStart.setDate(todayDate.getDate() - mondayOffset);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      rangeStart = getDateKey(weekStart);
      rangeEnd = getDateKey(weekEnd);
    }

    if (historyFilter === "month") {
      const monthStart = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        1
      );

      const monthEnd = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth() + 1,
        0
      );

      rangeStart = getDateKey(monthStart);
      rangeEnd = getDateKey(monthEnd);
    }

    if (historyFilter === "custom") {
      rangeStart = startDate;
      rangeEnd = endDate;
    }

    return [...workLogs]
      .filter((log) => {
        const logDate = getDateKey(log.date);

        if (!logDate) return false;

        if (historyFilter === "all") {
          return true;
        }

        if (!rangeStart || !rangeEnd) {
          return true;
        }

        return logDate >= rangeStart && logDate <= rangeEnd;
      })
      .sort((first, second) => {
        const firstDate = getDateKey(first.date);
        const secondDate = getDateKey(second.date);

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

  /* ================================
     GROUP WORK BY DATE
  ================================ */

  const groupedHistory = useMemo(() => {
    const grouped = {};

    filteredLogs.forEach((log) => {
      const dateKey = getDateKey(log.date);

      if (!dateKey) return;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(log);
    });

    return Object.entries(grouped)
      .map(([date, logs]) => {
        const sortedLogs = [...logs].sort((first, second) => {
          return String(first.startTime || "").localeCompare(
            String(second.startTime || "")
          );
        });

        const totalHours = sortedLogs.reduce((total, log) => {
          return total + getLogDurationInHours(log);
        }, 0);

        const works = sortedLogs.map((log, index) => ({
          id: log._id || log.id || `${date}-${index}`,
          name: log.workName || "Work",
          startTime: formatTime(log.startTime),
          endTime: formatTime(log.endTime),
          originalLog: log,
        }));

        return {
          date,
          works,
          startTime: formatTime(
            getEarliestTime(sortedLogs, "startTime")
          ),
          endTime: formatTime(
            getLatestTime(sortedLogs, "endTime")
          ),
          totalHours: Number(totalHours.toFixed(2)),
        };
      })
      .sort((first, second) => {
        return second.date.localeCompare(first.date);
      });
  }, [filteredLogs]);

  const totalHours = useMemo(() => {
    return filteredLogs.reduce((total, log) => {
      return total + getLogDurationInHours(log);
    }, 0);
  }, [filteredLogs]);

  /* ================================
     EDIT WORK
  ================================ */

  const handleEditWork = (log) => {
    setError("");
    setSuccess("");

    setEditingWork(log);

    setEditForm({
      workName: log.workName || "",
      date: getDateKey(log.date),
      startTime: log.startTime || "",
      endTime: log.endTime || "",
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const closeEditModal = () => {
    setEditingWork(null);

    setEditForm({
      workName: "",
      date: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleUpdateWork = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const workName = editForm.workName.trim();

    if (!workName) {
      setError("Please enter the work name.");
      return;
    }

    if (
      !editForm.date ||
      !editForm.startTime ||
      !editForm.endTime
    ) {
      setError("Please fill in all edit fields.");
      return;
    }

    const duration = calculateDuration(
      editForm.startTime,
      editForm.endTime
    );

    if (!duration) {
      setError("End time must be after start time.");
      return;
    }

    const workId = editingWork?._id || editingWork?.id;

    if (!workId) {
      setError("Work ID is missing.");
      return;
    }

    try {
      setSaving(true);

      await updateWorkLog(workId, {
        workName,
        date: editForm.date,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
      });

      const updatedDate = editForm.date;

      closeEditModal();

      setSuccess("Work details updated successfully.");

      setHistoryFilter("custom");
      setStartDate(updatedDate);
      setEndDate(updatedDate);

      await loadWorkLogs();
    } catch (err) {
      console.error("Update Work Log Error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to update work details."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================================
     DELETE WORK
  ================================ */

  const handleDeleteWork = async (id) => {
    if (!id) {
      setError("Work ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this work?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      await deleteWorkLog(id);

      setSuccess("Work details deleted successfully.");

      await loadWorkLogs();
    } catch (err) {
      console.error("Delete Work Log Error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to delete work details."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ================================
     RENDER
  ================================ */

  return (
    <div className="my-work-page">
      {/* PAGE HEADER */}

      <div className="my-work-header">
        <h1>My Work</h1>

        <p>
          Enter your daily work details and view your work history.
        </p>
      </div>

      {/* MESSAGES */}

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

      {/* ADD WORK */}

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>Add Work Details</h2>

            <p>
              Fill in the work name, time and date.
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
              {saving ? "Submitting..." : "Submit Work"}
            </button>
          </div>
        </form>
      </section>

      {/* WORK HISTORY */}

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>My Daily Work History</h2>

            <p>
              All work entries from the same day are combined into one row.
            </p>
          </div>
        </div>

        {/* FILTER */}

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

        {/* SUMMARY */}

        <div className="work-summary-grid">
          <div className="work-summary-card">
            <div className="summary-icon">📅</div>

            <div>
              <h3>Total Working Days</h3>

              <strong>{groupedHistory.length}</strong>
            </div>
          </div>

          <div className="work-summary-card">
            <div className="summary-icon">📝</div>

            <div>
              <h3>Total Work Entries</h3>

              <strong>{filteredLogs.length}</strong>
            </div>
          </div>

          <div className="work-summary-card">
            <div className="summary-icon">⏱️</div>

            <div>
              <h3>Total Hours</h3>

              <strong>{totalHours.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* HISTORY TABLE */}

        {loading ? (
          <div className="my-work-loading">
            <div className="loading-spinner" />

            <p>Loading work details...</p>
          </div>
        ) : groupedHistory.length === 0 ? (
          <div className="empty-work">
            <h3>No work details found</h3>

            <p>
              No work entries found for the selected filter.
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
                  <tr key={day.date}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>{formatDate(day.date)}</strong>
                    </td>

                    <td>
                      <div className="daily-work-details">
                        {day.works.map((work, workIndex) => (
                          <div
                            className="daily-work-item"
                            key={work.id || workIndex}
                          >
                            <div className="daily-work-name">
                              <span className="work-bullet">
                                •
                              </span>

                              <span>{work.name}</span>
                            </div>

                            <div className="daily-work-time">
                              {work.startTime} - {work.endTime}
                            </div>

                            <div className="work-actions">
                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() =>
                                  handleEditWork(
                                    work.originalLog
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-btn"
                                disabled={
                                  deletingId === work.id
                                }
                                onClick={() =>
                                  handleDeleteWork(work.id)
                                }
                              >
                                {deletingId === work.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td>{day.startTime}</td>

                    <td>{day.endTime}</td>

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

      {/* EDIT MODAL */}

      {editingWork && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h2>Edit Work</h2>

              <button
                type="button"
                className="close-modal-btn"
                onClick={closeEditModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateWork}>
              <div className="form-group">
                <label htmlFor="editWorkName">
                  Work Name
                </label>

                <input
                  id="editWorkName"
                  name="workName"
                  type="text"
                  value={editForm.workName}
                  onChange={handleEditChange}
                  maxLength={200}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="editDate">
                    Date
                  </label>

                  <input
                    id="editDate"
                    name="date"
                    type="date"
                    value={editForm.date}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editStartTime">
                    Starting Time
                  </label>

                  <input
                    id="editStartTime"
                    name="startTime"
                    type="time"
                    value={editForm.startTime}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editEndTime">
                    Ending Time
                  </label>

                  <input
                    id="editEndTime"
                    name="endTime"
                    type="time"
                    value={editForm.endTime}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Work"}
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