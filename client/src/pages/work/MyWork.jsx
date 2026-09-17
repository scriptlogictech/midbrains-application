
import { useEffect, useMemo, useState } from "react";
import { createWorkLog, getMyWorkLogs } from "../../services/workLogService";
import "./MyWork.css";

const getToday = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "";

  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);

  const difference = end - start;

  if (difference <= 0) return "";

  const totalMinutes = Math.floor(difference / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

const formatTime = (time) => {
  if (!time) return "-";

  const [hours, minutes] = time.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes));

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MyWork = () => {
  const [formData, setFormData] = useState({
    workName: "",
    date: getToday(),
    startTime: "",
    endTime: "",
  });

  const [workLogs, setWorkLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getToday());

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMyWorkLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyWorkLogs();

      const logs = Array.isArray(response)
        ? response
        : response?.data || response?.workLogs || [];

      setWorkLogs(logs);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to fetch your work history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWorkLogs();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const { workName, date, startTime, endTime } = formData;

    if (!workName.trim() || !date || !startTime || !endTime) {
      setError("Please fill in all fields.");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      setSubmitting(true);

      await createWorkLog({
        workName: workName.trim(),
        date,
        startTime,
        endTime,
      });

      setSuccess("Your work has been added successfully.");

      setFormData({
        workName: "",
        date: getToday(),
        startTime: "",
        endTime: "",
      });

      setSelectedDate(date);

      await fetchMyWorkLogs();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your work."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return workLogs
      .filter((log) => {
        const logDate = log.date
          ? new Date(log.date).toISOString().split("T")[0]
          : "";

        return logDate === selectedDate;
      })
      .sort((first, second) =>
        (first.startTime || "").localeCompare(second.startTime || "")
      );
  }, [workLogs, selectedDate]);

  const totalMinutes = filteredLogs.reduce((total, log) => {
    if (!log.startTime || !log.endTime) return total;

    const start = new Date(`1970-01-01T${log.startTime}`);
    const end = new Date(`1970-01-01T${log.endTime}`);

    const difference = end - start;

    return difference > 0
      ? total + Math.floor(difference / (1000 * 60))
      : total;
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const totalDuration =
    totalHours > 0
      ? `${totalHours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ""}`
      : `${remainingMinutes}m`;

  return (
    <div className="my-work-page">
      <div className="my-work-header">
        <div>
          <h1>My Work</h1>
          <p>Add your daily activities and view your work history.</p>
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

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>Add Daily Work</h2>
            <p>Record the work you completed during the day.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="workName">Work Activity</label>

              <input
                id="workName"
                name="workName"
                type="text"
                placeholder="e.g. Training, Follow-up, Calling"
                value={formData.workName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>

              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>

              <input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>

              <input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>

          {formData.startTime && formData.endTime && (
            <p>
              <strong>Duration: </strong>
              {calculateDuration(
                formData.startTime,
                formData.endTime
              ) || "Invalid time range"}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Add Work"}
            </button>
          </div>
        </form>
      </section>

      <section className="work-section">
        <div className="section-header">
          <div>
            <h2>My Work History</h2>
            <p>View your submitted work for a selected date.</p>
          </div>
        </div>

        <div className="work-filters">
          <div className="form-group">
            <label htmlFor="selectedDate">Select Date</label>

            <input
              id="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
        </div>

        <div className="work-summary-grid">
          <div className="work-summary-card">
            <div className="summary-icon">📋</div>

            <div>
              <span>Total Activities</span>
              <strong>{filteredLogs.length}</strong>
            </div>
          </div>

          <div className="work-summary-card">
            <div className="summary-icon">⏱️</div>

            <div>
              <span>Total Duration</span>
              <strong>{totalDuration}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="my-work-loading">
            <div className="loading-spinner"></div>
            <p>Loading your work history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-work">
            <h3>No Work Found</h3>
            <p>You have not added any work for this date.</p>
          </div>
        ) : (
          <div className="work-log-list">
            {filteredLogs.map((log) => (
              <div
                className="work-log-card"
                key={log._id || log.id}
              >
                <div className="work-log-header">
                  <div>
                    <h3>{log.workName || log.taskName}</h3>

                    <span>{formatDate(log.date)}</span>
                  </div>

                  <strong>
                    {calculateDuration(
                      log.startTime,
                      log.endTime
                    ) || "-"}
                  </strong>
                </div>

                <div className="work-log-details">
                  <div>
                    <span>Start Time</span>
                    <p>{formatTime(log.startTime)}</p>
                  </div>

                  <div>
                    <span>End Time</span>
                    <p>{formatTime(log.endTime)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyWork;