import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../../services/api";

import {
  createWorkTask,
  getWorkTasks,
  updateWorkTask,
  deleteWorkTask,
} from "../../services/workTaskService";

import {
  getAllWorkLogs,
} from "../../services/workLogService";

import "./WorkManagement.css";;


const initialForm = {
  company: "",
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  startDate: "",
  deadline: "",
  estimatedHours: "",
  remarks: "",
};


const WorkManagement = () => {
  const { companyId } = useParams();

  // ========================================
  // TASK STATES
  // ========================================

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);

  // ========================================
  // WORK LOG STATES
  // ========================================

  const [workLogs, setWorkLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [logEmployeeFilter, setLogEmployeeFilter] =
    useState("");

  const [logStartDate, setLogStartDate] =
    useState("");

  const [logEndDate, setLogEndDate] =
    useState("");

  const [selectedLog, setSelectedLog] =
    useState(null);

  const [showLogDetails, setShowLogDetails] =
    useState(false);

  // ========================================
  // GENERAL STATES
  // ========================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState(null);

  // ========================================
  // TASK FORM
  // ========================================

  const [form, setForm] = useState({
    ...initialForm,
    company: companyId || "",
  });

  // ========================================
  // TASK FILTERS
  // ========================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  // ========================================
  // TIMELINE STATES
  // ========================================

  const [timelineDate, setTimelineDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const [timelineStartHour, setTimelineStartHour] = useState(10);
  const [timelineEndHour, setTimelineEndHour] = useState(18);


  // ========================================
  // FETCH COMPANIES
  // ========================================

  const fetchCompanies = async () => {
    try {
      const response = await api.get(
        "/companies"
      );

      const data =
        response.data?.companies ||
        response.data ||
        [];

      setCompanies(data);

    } catch (err) {
      console.error(
        "Failed to fetch companies:",
        err
      );
    }
  };


  // ========================================
  // FETCH EMPLOYEES / INTERNS
  // ========================================

  const fetchEmployees = async (
    selectedCompanyId
  ) => {

    if (!selectedCompanyId) {
      setEmployees([]);
      return;
    }

    try {

      const response = await api.get(
        `/users/company/${selectedCompanyId}`
      );

      const users =
        response.data?.users || [];

      const workUsers = users.filter(
        (user) =>
          (
            user.role === "employee" ||
            user.role === "intern"
          ) &&
          user.isActive
      );

      setEmployees(workUsers);

    } catch (err) {

      console.error(
        "Failed to fetch employees:",
        err
      );

      setEmployees([]);
    }
  };


  // ========================================
  // FETCH TASKS
  // ========================================

  const fetchTasks = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await getWorkTasks(
          companyId
            ? { companyId }
            : {}
        );

      setTasks(
        response.tasks || []
      );

    } catch (err) {

      console.error(
        "Failed to fetch work:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load work tasks."
      );

    } finally {

      setLoading(false);
    }
  };


  // ========================================
  // FETCH DAILY WORK LOGS
  // ========================================

  const fetchWorkLogs = async () => {

    try {

      setLogsLoading(true);

      const params = {};

      if (companyId) {
        params.companyId = companyId;
      }

      if (logEmployeeFilter) {
        params.employeeId =
          logEmployeeFilter;
      }

      if (logStartDate) {
        params.startDate =
          logStartDate;
      }

      if (logEndDate) {
        params.endDate =
          logEndDate;
      }

      const response =
        await getAllWorkLogs(params);

      setWorkLogs(
        response.logs ||
        response.data ||
        []
      );

    } catch (err) {

      console.error(
        "Failed to fetch work logs:",
        err
      );

      setWorkLogs([]);

    } finally {

      setLogsLoading(false);
    }
  };


  // ========================================
  // INITIAL FETCH
  // ========================================

  useEffect(() => {

    fetchCompanies();
    fetchTasks();

  }, [companyId]);


  // ========================================
  // FETCH EMPLOYEES
  // ========================================

  useEffect(() => {

    fetchEmployees(form.company);

  }, [form.company]);


  // ========================================
  // FETCH WORK LOGS
  // ========================================

  useEffect(() => {

    fetchWorkLogs();

  }, [
    companyId,
    logEmployeeFilter,
    logStartDate,
    logEndDate,
  ]);


  // ========================================
  // FORM CHANGE
  // ========================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // ========================================
  // OPEN ADD MODAL
  // ========================================

  const handleAddWork = () => {

    setEditingTask(null);

    setForm({
      ...initialForm,
      company: companyId || "",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  // ========================================
  // OPEN EDIT MODAL
  // ========================================

  const handleEdit = (task) => {

    setEditingTask(task);

    setForm({

      company:
        task.company?._id ||
        task.company ||
        "",

      title:
        task.title || "",

      description:
        task.description || "",

      assignedTo:
        task.assignedTo?._id ||
        task.assignedTo ||
        "",

      priority:
        task.priority ||
        "medium",

      startDate:
        task.startDate
          ? task.startDate.substring(
              0,
              10
            )
          : "",

      deadline:
        task.deadline
          ? task.deadline.substring(
              0,
              10
            )
          : "",

      estimatedHours:
        task.estimatedHours ??
        "",

      remarks:
        task.remarks || "",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  // ========================================
  // CLOSE TASK MODAL
  // ========================================

  const closeModal = () => {

    if (saving) return;

    setShowModal(false);
    setEditingTask(null);

    setForm({
      ...initialForm,
      company: companyId || "",
    });
  };


  // ========================================
  // SUBMIT TASK
  // ========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setSaving(true);
      setError("");
      setSuccess("");


      if (!form.company) {

        setError(
          "Please select a company."
        );

        setSaving(false);
        return;
      }


      if (!form.title.trim()) {

        setError(
          "Task title is required."
        );

        setSaving(false);
        return;
      }


      if (!form.assignedTo) {

        setError(
          "Please select an employee or intern."
        );

        setSaving(false);
        return;
      }


      if (
        !form.startDate ||
        !form.deadline
      ) {

        setError(
          "Start date and deadline are required."
        );

        setSaving(false);
        return;
      }


      if (
        new Date(form.deadline) <
        new Date(form.startDate)
      ) {

        setError(
          "Deadline cannot be before the start date."
        );

        setSaving(false);
        return;
      }


      const payload = {

        company:
          form.company,

        title:
          form.title.trim(),

        description:
          form.description.trim(),

        assignedTo:
          form.assignedTo,

        priority:
          form.priority,

        startDate:
          form.startDate,

        deadline:
          form.deadline,

        estimatedHours:
          form.estimatedHours === ""
            ? 0
            : Number(
                form.estimatedHours
              ),

        remarks:
          form.remarks.trim(),
      };


      if (editingTask) {

        await updateWorkTask(
          editingTask._id,
          payload
        );

        setSuccess(
          "Work task updated successfully."
        );

      } else {

        await createWorkTask(
          payload
        );

        setSuccess(
          "Work assigned successfully."
        );
      }


      await fetchTasks();


      setTimeout(() => {

        closeModal();

      }, 500);

    } catch (err) {

      console.error(
        "Work save error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to save work task."
      );

    } finally {

      setSaving(false);
    }
  };


  // ========================================
  // DELETE TASK
  // ========================================

  const handleDelete = async (
    taskId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this work?"
      );

    if (!confirmed) return;


    try {

      setError("");

      await deleteWorkTask(
        taskId
      );

      setSuccess(
        "Work deleted successfully."
      );

      await fetchTasks();

    } catch (err) {

      console.error(
        "Delete work error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to delete work."
      );
    }
  };


  // ========================================
  // FILTER TASKS
  // ========================================

  const filteredTasks = useMemo(() => {

    const searchValue =
      search
        .toLowerCase()
        .trim();


    return tasks.filter(
      (task) => {

        const employeeName =
          task.assignedTo?.fullName
            ?.toLowerCase() ||
          "";

        const title =
          task.title
            ?.toLowerCase() ||
          "";

        const description =
          task.description
            ?.toLowerCase() ||
          "";


        const matchesSearch =
          !searchValue ||
          title.includes(
            searchValue
          ) ||
          employeeName.includes(
            searchValue
          ) ||
          description.includes(
            searchValue
          );


        const matchesStatus =
          !statusFilter ||
          task.status ===
            statusFilter;


        const matchesPriority =
          !priorityFilter ||
          task.priority ===
            priorityFilter;


        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority
        );
      }
    );

  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
  ]);


  // ========================================
  // SUMMARY
  // ========================================

  const totalTasks =
    tasks.length;


  const pendingTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "pending"
    ).length;


  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "in_progress"
    ).length;


  const completedTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "completed"
    ).length;


  const overdueTasks =
    tasks.filter((task) => {

      if (
        task.status ===
          "completed" ||
        task.status ===
          "cancelled"
      ) {
        return false;
      }

      return (
        task.deadline &&
        new Date(
          task.deadline
        ) < new Date()
      );

    }).length;


  // ========================================
  // FORMAT DATE
  // ========================================

  const formatDate = (
    date
  ) => {

    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  // ========================================
  // FORMAT DATE & TIME
  // ========================================

  const formatDateTime = (
    date
  ) => {

    if (!date) return "-";

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


  // ========================================
  // STATUS LABEL
  // ========================================

  const getStatusLabel = (
    status
  ) => {

    const labels = {

      pending:
        "Pending",

      in_progress:
        "In Progress",

      on_hold:
        "On Hold",

      completed:
        "Completed",

      cancelled:
        "Cancelled",
    };

    return (
      labels[status] ||
      status
    );
  };


  // ========================================
  // ROLE LABEL
  // ========================================

  const getRoleLabel = (
    role
  ) => {

    return role ===
      "intern"
      ? "Intern"
      : "Employee";
  };


  // ========================================
  // OPEN LOG DETAILS
  // ========================================

  const handleViewLog = (
    log
  ) => {

    setSelectedLog(log);
    setShowLogDetails(true);
  };


  // ========================================
  // CLOSE LOG DETAILS
  // ========================================

  const closeLogDetails = () => {

    setSelectedLog(null);
    setShowLogDetails(false);
  };


  // ========================================
  // CLEAR LOG FILTERS
  // ========================================

  const clearLogFilters = () => {

    setLogEmployeeFilter("");
    setLogStartDate("");
    setLogEndDate("");
  };


  // ========================================
  // TIMELINE DATA
  // ========================================

  const timelineHours = useMemo(() => {
    const hours = [];

    for (let hour = timelineStartHour; hour < timelineEndHour; hour += 1) {
      hours.push(hour);
    }

    return hours;
  }, [timelineStartHour, timelineEndHour]);

  const formatHour = (hour) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${suffix}`;
  };

  const timelineEmployees = useMemo(() => {
    const employeeMap = new Map();

    [...employees, ...filteredTasks.map((task) => task.assignedTo).filter(Boolean)].forEach((employee) => {
      const employeeId = employee?._id || employee?.id;

      if (employeeId && !employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, employee);
      }
    });

    return Array.from(employeeMap.values());
  }, [employees, filteredTasks]);

  const getTimelineTasks = (employeeId) => {
    const employeeTasks = filteredTasks
      .filter((task) => {
        const taskEmployeeId = task.assignedTo?._id || task.assignedTo;
        const taskStartDate = task.startDate?.substring(0, 10);
        const taskDeadline = task.deadline?.substring(0, 10);

        const isEmployeeMatch = String(taskEmployeeId) === String(employeeId);
        const isDateMatch =
          (taskStartDate && taskStartDate <= timelineDate) &&
          (!taskDeadline || taskDeadline >= timelineDate);

        return isEmployeeMatch && isDateMatch;
      })
      .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));

    let nextHour = timelineStartHour;

    return employeeTasks.map((task) => {
      const duration = Math.max(1, Math.ceil(Number(task.estimatedHours) || 1));
      const startHour = nextHour;
      const endHour = Math.min(startHour + duration, timelineEndHour);

      nextHour = Math.min(endHour, timelineEndHour);

      return {
        ...task,
        timelineStartHour: startHour,
        timelineDuration: Math.max(1, endHour - startHour),
        timelineWidth: `${Math.max(1, endHour - startHour) * 100}%`,
      };
    });
  };


  return (

    <div className="work-management-page">


      {/* ======================================
          HEADER
      ====================================== */}

      <div className="work-page-header">

        <div>

          <span className="work-page-subtitle">
            WORK MANAGEMENT
          </span>

          <h1>
            Employee Work
          </h1>

          <p>
            Assign work and track employee
            and intern progress.
          </p>

        </div>


        <button
          className="add-work-btn"
          onClick={
            handleAddWork
          }
        >

          <i className="bi bi-plus-lg"></i>

          Assign New Work

        </button>

      </div>


      {/* ======================================
          ALERTS
      ====================================== */}

      {error && (

        <div className="work-alert error">

          <i className="bi bi-exclamation-circle"></i>

          {error}

          <button
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>

        </div>

      )}


      {success && (

        <div className="work-alert success">

          <i className="bi bi-check-circle"></i>

          {success}

          <button
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>

        </div>

      )}


      {/* ======================================
          SUMMARY
      ====================================== */}

      <div className="work-summary-grid">


        <div className="work-summary-card">

          <div className="summary-icon blue">

            <i className="bi bi-list-task"></i>

          </div>

          <div>

            <span>
              Total Work
            </span>

            <strong>
              {totalTasks}
            </strong>

          </div>

        </div>


        <div className="work-summary-card">

          <div className="summary-icon orange">

            <i className="bi bi-hourglass-split"></i>

          </div>

          <div>

            <span>
              Pending
            </span>

            <strong>
              {pendingTasks}
            </strong>

          </div>

        </div>


        <div className="work-summary-card">

          <div className="summary-icon purple">

            <i className="bi bi-arrow-repeat"></i>

          </div>

          <div>

            <span>
              In Progress
            </span>

            <strong>
              {inProgressTasks}
            </strong>

          </div>

        </div>


        <div className="work-summary-card">

          <div className="summary-icon green">

            <i className="bi bi-check2-circle"></i>

          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {completedTasks}
            </strong>

          </div>

        </div>


        <div className="work-summary-card">

          <div className="summary-icon red">

            <i className="bi bi-exclamation-triangle"></i>

          </div>

          <div>

            <span>
              Overdue
            </span>

            <strong>
              {overdueTasks}
            </strong>

          </div>

        </div>


      </div>


      {/* ======================================
          TASK FILTERS
      ====================================== */}

      <div className="work-filter-card">

        <div className="work-search">

          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search task or employee..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>


        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >

          <option value="">
            All Status
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="in_progress">
            In Progress
          </option>

          <option value="on_hold">
            On Hold
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="cancelled">
            Cancelled
          </option>

        </select>


        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(
              e.target.value
            )
          }
        >

          <option value="">
            All Priority
          </option>

          <option value="low">
            Low
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="high">
            High
          </option>

          <option value="urgent">
            Urgent
          </option>

        </select>

      </div>


      {/* ======================================
          DAILY WORK TIMELINE
      ====================================== */}

      <div className="work-table-card work-timeline-section">
        <div className="work-table-header work-timeline-header">
          <div>
            <h3>Daily Work Timeline</h3>
            <span>View employee work by time slots</span>
          </div>

          <div className="timeline-controls">
            <label>
              Date
              <input
                type="date"
                value={timelineDate}
                onChange={(event) => setTimelineDate(event.target.value)}
              />
            </label>

            <label>
              From
              <select
                value={timelineStartHour}
                onChange={(event) => {
                  const nextStartHour = Number(event.target.value);
                  setTimelineStartHour(nextStartHour);
                  if (nextStartHour >= timelineEndHour) {
                    setTimelineEndHour(nextStartHour + 1);
                  }
                }}
              >
                {Array.from({ length: 12 }, (_, index) => index + 8).map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              To
              <select
                value={timelineEndHour}
                onChange={(event) => {
                  const nextEndHour = Number(event.target.value);
                  if (nextEndHour > timelineStartHour) {
                    setTimelineEndHour(nextEndHour);
                  }
                }}
              >
                {Array.from({ length: 12 }, (_, index) => index + 9).map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {timelineEmployees.length === 0 ? (
          <div className="work-empty">
            <i className="bi bi-calendar-x"></i>
            <h4>No timeline data</h4>
            <p>Assign work to an employee or intern to see the daily schedule.</p>
          </div>
        ) : (
          <div className="timeline-scroll-wrapper">
            <div className="work-timeline" style={{ minWidth: `${220 + timelineHours.length * 135}px` }}>
              <div className="timeline-row timeline-heading-row">
                <div className="timeline-employee-column">Employee</div>
                <div className="timeline-hours">
                  {timelineHours.map((hour) => (
                    <div className="timeline-hour" key={hour}>
                      {formatHour(hour)}
                    </div>
                  ))}
                </div>
              </div>

              {timelineEmployees.map((employee) => {
                const employeeId = employee._id || employee.id;
                const employeeTasks = getTimelineTasks(employeeId);

                return (
                  <div className="timeline-row" key={employeeId}>
                    <div className="timeline-employee-column timeline-employee">
                      <div className="employee-avatar">
                        {employee.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <strong>{employee.fullName || "Unknown"}</strong>
                        <span>{getRoleLabel(employee.role)}</span>
                      </div>
                    </div>

                    <div className="timeline-hours timeline-work-area">
                      {timelineHours.map((hour) => (
                        <div className="timeline-cell" key={`${employeeId}-${hour}`}></div>
                      ))}

                      {employeeTasks.map((task) => {
                        const left = Math.max(0, task.timelineStartHour - timelineStartHour) * (100 / timelineHours.length);
                        const width = task.timelineDuration * (100 / timelineHours.length);

                        return (
                          <button
                            type="button"
                            className={`timeline-task-block ${task.priority || "medium"}`}
                            key={task._id}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${task.title} | ${getStatusLabel(task.status)}`}
                            onClick={() => handleEdit(task)}
                          >
                            <strong>{task.title}</strong>
                            <span>{task.timelineDuration} hr{task.timelineDuration > 1 ? "s" : ""}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>


      {/* ======================================
          ASSIGNED WORK TABLE
      ====================================== */}

      <div className="work-table-card">

        <div className="work-table-header">

          <div>

            <h3>
              Assigned Work
            </h3>

            <span>

              {filteredTasks.length}

              {" "}

              work item
              {filteredTasks.length !== 1
                ? "s"
                : ""}

            </span>

          </div>

        </div>


        {loading ? (

          <div className="work-loading">

            <div className="spinner-border"></div>

            <p>
              Loading work...
            </p>

          </div>

        ) : filteredTasks.length === 0 ? (

          <div className="work-empty">

            <i className="bi bi-clipboard-x"></i>

            <h4>
              No work found
            </h4>

            <p>
              Assign work to an employee
              or intern to get started.
            </p>

          </div>

        ) : (

          <div className="work-table-wrapper">

            <table className="work-table">

              <thead>

                <tr>

                  <th>
                    Work
                  </th>

                  <th>
                    Assigned To
                  </th>

                  <th>
                    Priority
                  </th>

                  <th>
                    Deadline
                  </th>

                  <th>
                    Progress
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredTasks.map(
                  (task) => {

                    const progress =
                      Number(
                        task.progress ||
                        0
                      );


                    return (

                      <tr
                        key={
                          task._id
                        }
                      >

                        <td>

                          <div className="task-title-cell">

                            <strong>
                              {task.title}
                            </strong>

                            {task.description && (

                              <span>

                                {task.description.length >
                                65
                                  ? `${task.description.substring(
                                      0,
                                      65
                                    )}...`
                                  : task.description}

                              </span>

                            )}

                          </div>

                        </td>


                        <td>

                          <div className="employee-cell">

                            <div className="employee-avatar">

                              {task.assignedTo
                                ?.fullName
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}

                            </div>


                            <div>

                              <strong>

                                {task.assignedTo
                                  ?.fullName ||
                                  "-"}

                              </strong>

                              <span>

                                {getRoleLabel(
                                  task.assignedTo
                                    ?.role
                                )}

                              </span>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span
                            className={`priority-badge ${task.priority}`}
                          >
                            {task.priority}
                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              task.deadline &&
                              new Date(
                                task.deadline
                              ) <
                                new Date() &&
                              task.status !==
                                "completed"
                                ? "deadline overdue"
                                : "deadline"
                            }
                          >

                            {formatDate(
                              task.deadline
                            )}

                          </span>

                        </td>


                        <td>

                          <div className="progress-cell">

                            <div className="progress-top">

                              <span>
                                {progress}%
                              </span>

                            </div>


                            <div className="progress-track">

                              <div
                                className="progress-fill"
                                style={{
                                  width: `${progress}%`,
                                }}
                              ></div>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span
                            className={`status-badge ${task.status}`}
                          >

                            {getStatusLabel(
                              task.status
                            )}

                          </span>

                        </td>


                        <td>

                          <div className="action-buttons">

                            <button
                              className="edit-action"
                              title="Edit"
                              onClick={() =>
                                handleEdit(
                                  task
                                )
                              }
                            >

                              <i className="bi bi-pencil"></i>

                            </button>


                            <button
                              className="delete-action"
                              title="Delete"
                              onClick={() =>
                                handleDelete(
                                  task._id
                                )
                              }
                            >

                              <i className="bi bi-trash3"></i>

                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================
          DAILY WORK LOGS
      ====================================== */}

      <div className="work-table-card work-logs-section">

        <div className="work-table-header">

          <div>

            <h3>
              Daily Work Logs
            </h3>

            <span>
              Employee and intern daily updates
            </span>

          </div>


          <button
            type="button"
            className="refresh-logs-btn"
            onClick={
              fetchWorkLogs
            }
            disabled={
              logsLoading
            }
          >

            <i className="bi bi-arrow-clockwise"></i>

            {logsLoading
              ? "Loading..."
              : "Refresh"}

          </button>

        </div>


        {/* ======================================
            LOG FILTERS
        ====================================== */}

        <div className="work-log-filters">

          <div className="work-search">

            <i className="bi bi-person"></i>

            <select
              value={
                logEmployeeFilter
              }
              onChange={(e) =>
                setLogEmployeeFilter(
                  e.target.value
                )
              }
            >

              <option value="">
                All Employees / Interns
              </option>

              {employees.map(
                (employee) => (

                  <option
                    key={
                      employee._id
                    }
                    value={
                      employee._id
                    }
                  >

                    {employee.fullName}
                    {" "}
                    (
                    {getRoleLabel(
                      employee.role
                    )}
                    )

                  </option>

                )
              )}

            </select>

          </div>


          <div className="log-date-filter">

            <label>
              From
            </label>

            <input
              type="date"
              value={
                logStartDate
              }
              onChange={(e) =>
                setLogStartDate(
                  e.target.value
                )
              }
            />

          </div>


          <div className="log-date-filter">

            <label>
              To
            </label>

            <input
              type="date"
              value={
                logEndDate
              }
              onChange={(e) =>
                setLogEndDate(
                  e.target.value
                )
              }
            />

          </div>


          {(logEmployeeFilter ||
            logStartDate ||
            logEndDate) && (

            <button
              type="button"
              className="clear-log-filter-btn"
              onClick={
                clearLogFilters
              }
            >

              <i className="bi bi-x-circle"></i>

              Clear

            </button>

          )}

        </div>


        {/* ======================================
            LOG TABLE
        ====================================== */}

        {logsLoading ? (

          <div className="work-loading">

            <div className="spinner-border"></div>

            <p>
              Loading daily work logs...
            </p>

          </div>

        ) : workLogs.length === 0 ? (

          <div className="work-empty">

            <i className="bi bi-journal-x"></i>

            <h4>
              No Daily Work Logs
            </h4>

            <p>
              Employee and intern daily updates
              will appear here.
            </p>

          </div>

        ) : (

          <div className="work-table-wrapper">

            <table className="work-table">

              <thead>

                <tr>

                  <th>
                    Employee
                  </th>

                  <th>
                    Task
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Progress
                  </th>

                  <th>
                    Hours
                  </th>

                  <th>
                    Work Description
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {workLogs.map(
                  (log) => (

                    <tr
                      key={
                        log._id
                      }
                    >

                      {/* Employee */}

                      <td>

                        <div className="employee-cell">

                          <div className="employee-avatar">

                            {log.employee
                              ?.fullName
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "U"}

                          </div>


                          <div>

                            <strong>

                              {log.employee
                                ?.fullName ||
                                "-"}

                            </strong>

                            <span>

                              {getRoleLabel(
                                log.employee
                                  ?.role
                              )}

                            </span>

                          </div>

                        </div>

                      </td>


                      {/* Task */}

                      <td>

                        <div className="task-title-cell">

                          <strong>

                            {log.task
                              ?.title ||
                              "-"}

                          </strong>

                        </div>

                      </td>


                      {/* Date */}

                      <td>

                        {formatDate(
                          log.date
                        )}

                      </td>


                      {/* Progress */}

                      <td>

                        <div className="progress-cell">

                          <div className="progress-top">

                            <span>
                              {Number(
                                log.progress ||
                                0
                              )}
                              %
                            </span>

                          </div>


                          <div className="progress-track">

                            <div
                              className="progress-fill"
                              style={{
                                width: `${Number(
                                  log.progress ||
                                  0
                                )}%`,
                              }}
                            ></div>

                          </div>

                        </div>

                      </td>


                      {/* Hours */}

                      <td>

                        <strong>
                          {log.hoursWorked ||
                            0}
                          h
                        </strong>

                      </td>


                      {/* Description */}

                      <td>

                        <div className="log-description-cell">

                          {log.workDescription
                            ?.length >
                          70
                            ? `${log.workDescription.substring(
                                0,
                                70
                              )}...`
                            : log.workDescription ||
                              "-"}

                        </div>

                      </td>


                      {/* Actions */}

                      <td>

                        <button
                          className="view-log-btn"
                          title="View Details"
                          onClick={() =>
                            handleViewLog(
                              log
                            )
                          }
                        >

                          <i className="bi bi-eye"></i>

                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================
          ADD / EDIT TASK MODAL
      ====================================== */}

      {showModal && (

        <div
          className="work-modal-overlay"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div className="work-modal">

            <div className="work-modal-header">

              <div>

                <span>

                  {editingTask
                    ? "UPDATE WORK"
                    : "NEW ASSIGNMENT"}

                </span>

                <h2>

                  {editingTask
                    ? "Edit Work"
                    : "Assign New Work"}

                </h2>

              </div>


              <button
                className="modal-close"
                onClick={
                  closeModal
                }
              >

                <i className="bi bi-x-lg"></i>

              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="work-modal-body">


                {/* Company */}

                <div className="form-group">

                  <label>

                    Company
                    <span>*</span>

                  </label>


                  <select
                    name="company"
                    value={
                      form.company
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Company
                    </option>


                    {companies.map(
                      (company) => (

                        <option
                          key={
                            company._id
                          }
                          value={
                            company._id
                          }
                        >

                          {
                            company.companyName
                          }

                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* Employee / Intern */}

                <div className="form-group">

                  <label>

                    Assign To
                    <span>*</span>

                  </label>


                  <select
                    name="assignedTo"
                    value={
                      form.assignedTo
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Employee / Intern
                    </option>


                    {employees.map(
                      (employee) => (

                        <option
                          key={
                            employee._id
                          }
                          value={
                            employee._id
                          }
                        >

                          {
                            employee.fullName
                          }

                          {" "}

                          (

                          {getRoleLabel(
                            employee.role
                          )}

                          )

                        </option>

                      )
                    )}

                  </select>


                  {form.company &&
                    employees.length ===
                      0 && (

                      <small className="form-help">

                        No active employees
                        or interns found
                        for this company.

                      </small>

                    )}

                </div>


                {/* Title */}

                <div className="form-group">

                  <label>

                    Work Title
                    <span>*</span>

                  </label>


                  <input
                    type="text"
                    name="title"
                    value={
                      form.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter work title"
                    required
                  />

                </div>


                {/* Priority */}

                <div className="form-group">

                  <label>
                    Priority
                  </label>


                  <select
                    name="priority"
                    value={
                      form.priority
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>

                    <option value="urgent">
                      Urgent
                    </option>

                  </select>

                </div>


                {/* Start Date */}

                <div className="form-group">

                  <label>

                    Start Date
                    <span>*</span>

                  </label>


                  <input
                    type="date"
                    name="startDate"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                {/* Deadline */}

                <div className="form-group">

                  <label>

                    Deadline
                    <span>*</span>

                  </label>


                  <input
                    type="date"
                    name="deadline"
                    value={
                      form.deadline
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                {/* Estimated Hours */}

                <div className="form-group">

                  <label>
                    Estimated Hours
                  </label>


                  <input
                    type="number"
                    name="estimatedHours"
                    value={
                      form.estimatedHours
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="0.5"
                    placeholder="e.g. 8"
                  />

                </div>


                {/* Description */}

                <div className="form-group full-width">

                  <label>
                    Work Description
                  </label>


                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    placeholder="Describe what needs to be completed..."
                  />

                </div>


                {/* Remarks */}

                <div className="form-group full-width">

                  <label>
                    Remarks
                  </label>


                  <textarea
                    name="remarks"
                    value={
                      form.remarks
                    }
                    onChange={
                      handleChange
                    }
                    rows="3"
                    placeholder="Additional instructions or remarks..."
                  />

                </div>

              </div>


              <div className="work-modal-footer">

                <button
                  type="button"
                  className="cancel-work-btn"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  className="save-work-btn"
                  disabled={
                    saving
                  }
                >

                  {saving ? (

                    <>

                      <span className="spinner-border spinner-border-sm"></span>

                      Saving...

                    </>

                  ) : (

                    <>

                      <i
                        className={`bi ${
                          editingTask
                            ? "bi-check-lg"
                            : "bi-plus-lg"
                        }`}
                      ></i>


                      {editingTask
                        ? "Update Work"
                        : "Assign Work"}

                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================
          WORK LOG DETAILS MODAL
      ====================================== */}

      {showLogDetails &&
        selectedLog && (

          <div
            className="work-modal-overlay"
            onMouseDown={(e) => {

              if (
                e.target ===
                e.currentTarget
              ) {
                closeLogDetails();
              }

            }}
          >

            <div className="work-modal log-details-modal">


              {/* Header */}

              <div className="work-modal-header">

                <div>

                  <span>
                    DAILY WORK LOG
                  </span>

                  <h2>
                    Work Update Details
                  </h2>

                </div>


                <button
                  className="modal-close"
                  onClick={
                    closeLogDetails
                  }
                >

                  <i className="bi bi-x-lg"></i>

                </button>

              </div>


              {/* Body */}

              <div className="log-details-body">


                {/* Employee */}

                <div className="log-detail-user">

                  <div className="employee-avatar large-avatar">

                    {selectedLog.employee
                      ?.fullName
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "U"}

                  </div>


                  <div>

                    <strong>

                      {selectedLog.employee
                        ?.fullName ||
                        "-"}

                    </strong>

                    <span>

                      {getRoleLabel(
                        selectedLog.employee
                          ?.role
                      )}

                    </span>

                  </div>

                </div>


                {/* Task */}

                <div className="log-detail-grid">

                  <div className="log-detail-item">

                    <span>
                      Task
                    </span>

                    <strong>

                      {selectedLog.task
                        ?.title ||
                        "-"}

                    </strong>

                  </div>


                  <div className="log-detail-item">

                    <span>
                      Date
                    </span>

                    <strong>

                      {formatDate(
                        selectedLog.date
                      )}

                    </strong>

                  </div>


                  <div className="log-detail-item">

                    <span>
                      Progress
                    </span>

                    <strong>

                      {Number(
                        selectedLog.progress ||
                        0
                      )}
                      %

                    </strong>

                  </div>


                  <div className="log-detail-item">

                    <span>
                      Hours Worked
                    </span>

                    <strong>

                      {selectedLog.hoursWorked ||
                        0}
                      hours

                    </strong>

                  </div>

                </div>


                {/* Work Description */}

                <div className="log-detail-text">

                  <span>
                    Work Description
                  </span>

                  <p>

                    {selectedLog.workDescription ||
                      "-"}

                  </p>

                </div>


                {/* Blockers */}

                <div className="log-detail-text">

                  <span>
                    Blockers
                  </span>

                  <p>

                    {selectedLog.blockers ||
                      "No blockers reported."}

                  </p>

                </div>


                {/* Next Plan */}

                <div className="log-detail-text">

                  <span>
                    Next Plan
                  </span>

                  <p>

                    {selectedLog.nextPlan ||
                      "No next plan provided."}

                  </p>

                </div>


                {/* Created */}

                <div className="log-created-info">

                  Submitted:

                  {" "}

                  {formatDateTime(
                    selectedLog.createdAt
                  )}

                </div>

              </div>


              {/* Footer */}

              <div className="work-modal-footer">

                <button
                  type="button"
                  className="cancel-work-btn"
                  onClick={
                    closeLogDetails
                  }
                >

                  Close

                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
};


export default WorkManagement;