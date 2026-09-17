
import { useEffect, useMemo, useState } from "react";
import { getAllWorkLogs } from "../../services/workLogService";
import "./WorkManagement.css";

const getToday = () => {
  return new Date().toISOString().split("T")[0];
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

const getEmployeeName = (log) => {
  return (
    log.employee?.name ||
    log.employee?.fullName ||
    log.user?.name ||
    log.user?.fullName ||
    log.employeeName ||
    log.userName ||
    "Unknown Employee"
  );
};

const getEmployeeRole = (log) => {
  return (
    log.employee?.role ||
    log.user?.role ||
    log.role ||
    "Employee"
  );
};

const getWorkName = (log) => {
  return log.workName || log.taskName || log.description || "Work";
};

const timeToMinutes = (time) => {
  if (!time) return 0;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const getPriorityClass = (workName) => {
  const work = workName.toLowerCase();

  if (
    work.includes("urgent") ||
    work.includes("important")
  ) {
    return "urgent";
  }

  if (
    work.includes("calling") ||
    work.includes("follow")
  ) {
    return "high";
  }

  if (
    work.includes("training") ||
    work.includes("interview")
  ) {
    return "medium";
  }

  return "low";
};

const WorkManagement = () => {
  const [workLogs, setWorkLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getToday());

  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(18);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAllWorkLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllWorkLogs({
        date: selectedDate,
      });

      const logs = Array.isArray(response)
        ? response
        : response?.data ||
          response?.workLogs ||
          response?.logs ||
          [];

      setWorkLogs(logs);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to fetch employee work logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllWorkLogs();
  }, [selectedDate]);

  const hours = useMemo(() => {
    const result = [];

    for (let hour = startHour; hour < endHour; hour += 1) {
      result.push(hour);
    }

    return result;
  }, [startHour, endHour]);

  const employees = useMemo(() => {
    const employeeMap = new Map();

    workLogs.forEach((log) => {
      const employeeId =
        log.employee?._id ||
        log.employee?.id ||
        log.user?._id ||
        log.user?.id ||
        log.employeeId ||
        log.userId ||
        getEmployeeName(log);

      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          id: employeeId,
          name: getEmployeeName(log),
          role: getEmployeeRole(log),
          logs: [],
        });
      }

      employeeMap.get(employeeId).logs.push(log);
    });

    return Array.from(employeeMap.values());
  }, [workLogs]);

  const getTaskPosition = (log) => {
    const timelineStart = startHour * 60;
    const timelineEnd = endHour * 60;
    const timelineDuration = timelineEnd - timelineStart;

    const workStart = timeToMinutes(log.startTime);
    const workEnd = timeToMinutes(log.endTime);

    const visibleStart = Math.max(workStart, timelineStart);
    const visibleEnd = Math.min(workEnd, timelineEnd);

    if (visibleEnd <= visibleStart) {
      return null;
    }

    const left =
      ((visibleStart - timelineStart) / timelineDuration) * 100;

    const width =
      ((visibleEnd - visibleStart) / timelineDuration) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const formatHour = (hour) => {
    const date = new Date();

    date.setHours(hour, 0, 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="work-management-page">
      <div className="work-section work-timeline-section">
        <div className="section-header work-timeline-header">
          <div>
            <h2>Employee Work Timeline</h2>
            <p>
              View the daily work activities of all employees
              and interns.
            </p>
          </div>

          <div className="timeline-controls">
            <label>
              Date
              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
              />
            </label>

            <label>
              Start Hour
              <select
                value={startHour}
                onChange={(event) =>
                  setStartHour(Number(event.target.value))
                }
              >
                {Array.from({ length: 12 }, (_, index) => index + 6).map(
                  (hour) => (
                    <option key={hour} value={hour}>
                      {formatHour(hour)}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              End Hour
              <select
                value={endHour}
                onChange={(event) =>
                  setEndHour(Number(event.target.value))
                }
              >
                {Array.from({ length: 12 }, (_, index) => index + 12).map(
                  (hour) => (
                    <option
                      key={hour}
                      value={hour}
                      disabled={hour <= startHour}
                    >
                      {formatHour(hour)}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </div>

        {error && (
          <div className="form-message error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="my-work-loading">
            <div className="loading-spinner"></div>
            <p>Loading employee work...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="empty-work">
            <h3>No Work Found</h3>
            <p>
              No employee or intern has added work for this date.
            </p>
          </div>
        ) : (
          <div className="timeline-scroll-wrapper">
            <div className="work-timeline">
              <div className="timeline-row timeline-heading-row">
                <div className="timeline-employee-column">
                  Employee
                </div>

                <div className="timeline-hours">
                  {hours.map((hour) => (
                    <div className="timeline-hour" key={hour}>
                      {formatHour(hour)}
                    </div>
                  ))}
                </div>
              </div>

              {employees.map((employee) => (
                <div className="timeline-row" key={employee.id}>
                  <div className="timeline-employee-column timeline-employee">
                    <div>
                      <strong>{employee.name}</strong>
                      <span>{employee.role}</span>
                    </div>
                  </div>

                  <div className="timeline-hours timeline-work-area">
                    {hours.map((hour) => (
                      <div
                        className="timeline-cell"
                        key={`${employee.id}-${hour}`}
                      ></div>
                    ))}

                    {employee.logs.map((log) => {
                      const position = getTaskPosition(log);

                      if (!position) return null;

                      const workName = getWorkName(log);
                      const priorityClass =
                        getPriorityClass(workName);

                      return (
                        <div
                          key={log._id || log.id}
                          className={`timeline-task-block ${priorityClass}`}
                          style={position}
                          title={`${workName} | ${formatTime(
                            log.startTime
                          )} - ${formatTime(log.endTime)}`}
                        >
                          <strong>{workName}</strong>

                          <span>
                            {formatTime(log.startTime)} -{" "}
                            {formatTime(log.endTime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkManagement;