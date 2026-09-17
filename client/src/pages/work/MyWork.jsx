import { useEffect, useMemo, useState } from "react";
import {
  createWorkLog,
  getMyWorkLogs,
} from "../../services/workLogService";
import "./MyWork.css"

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

const getLogEmployeeName = (employee) => {
  if (!employee) return "You";
  if (typeof employee === "string") return employee;

  return employee.fullName || employee.name || employee.email || "You";
};

const getDurationLabel = (log) => {
  if (typeof log.totalDuration === "number") {
    return `${log.totalDuration} hr`;
  }

  return calculateDuration(log.startTime, log.endTime) || "-";
};

const initialForm = {
  workName: "",
  date: getToday(),
  startTime: "",
  endTime: "",
};

const MyWork = () => {
  const [formData, setFormData] = useState(initialForm);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterDate, setFilterDate] = useState(getToday());

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

  const totalDuration = useMemo(() => {
    return calculateDuration(formData.startTime, formData.endTime);
  }, [formData.startTime, formData.endTime]);

  const filteredLogs = useMemo(() => {
    return [...workLogs]
      .filter((log) => {
        if (!filterDate) return true;

        const logDate = new Date(log.date);
        if (Number.isNaN(logDate.getTime())) return false;

        const year = logDate.getFullYear();
        const month = String(logDate.getMonth() + 1).padStart(2, "0");
        const day = String(logDate.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}` === filterDate;
      })
      .sort((first, second) => {
        return String(first.startTime || "").localeCompare(
          String(second.startTime || "")
        );
      });
  }, [workLogs, filterDate]);

  const selectedDateTotal = useMemo(() => {
    return filteredLogs.reduce((total, log) => {
      if (typeof log.totalDuration === "number") {
        return total + log.totalDuration;
      }

      return (
        total +
        calculateDurationInHours(log.startTime, log.endTime)
      );
    }, 0);
  }, [filteredLogs]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const workName = formData.workName.trim();

    if (!workName) {
      setError("Please enter the work name.");
      return;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
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
      setFilterDate(formData.date);
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

  return (
    <div className="my-work-page">
      <div className="my-work-header">
        <div>
          <h1>My Work</h1>
          <p>Enter your daily work details in a simple form.</p>
        </div>
      </div>

      {error && <div className="form-message error-message">{error}</div>}
      {success && (
        <div className="form-message success-message">{success}</div>
      )}

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
              <label htmlFor="startTime">Starting Time</label>
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
              <label htmlFor="endTime">Ending Time</label>
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
              <label htmlFor="totalDuration">Total Duration</label>
              <input
                id="totalDuration"
                type="text"
                value={totalDuration || "Calculated automatically"}
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

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>My Daily Work</h2>
            <p>View your submitted work in time order.</p>
          </div>
        </div>

        <div className="work-filters">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filterDate">Select Date</label>
            <input
              id="filterDate"
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
            />
          </div>
        </div>

        <div className="work-summary-grid">
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
              <strong>{selectedDateTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="my-work-loading">
            <div className="loading-spinner" />
            <p>Loading work details...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-work">
            <h3>No work details found</h3>
            <p>Submit your first work entry for this date.</p>
          </div>
        ) : (
          <div className="work-log-list">
            {filteredLogs.map((log) => (
              <article className="work-log-card" key={log._id}>
                <div className="work-log-header">
                  <div>
                    <h3>{log.workName || "Work Entry"}</h3>
                    <span>{formatDate(log.date)}</span>
                  </div>
                  <strong>{getDurationLabel(log)}</strong>
                </div>

                <div className="work-log-details">
                  <div>
                    <span>Employee / Intern</span>
                    <p>{getLogEmployeeName(log.employee)}</p>
                  </div>

                  <div>
                    <span>Working Time</span>
                    <p>
                      {formatTime(log.startTime)} - {formatTime(log.endTime)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyWork;
