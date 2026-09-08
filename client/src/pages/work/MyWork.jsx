import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
    getMyWork,
    updateWorkProgress,
} from "../../services/workTaskService";

import {
    createWorkLog,
    getMyWorkLogs,
} from "../../services/workLogService";

import "./MyWork.css";


const MyWork = () => {
    const { companyId } = useParams();

    const [tasks, setTasks] = useState([]);
    const [workLogs, setWorkLogs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);

    const [progressData, setProgressData] = useState({
        progress: 0,
        status: "pending",
        remarks: "",
    });

    const [logForm, setLogForm] = useState({
        task: "",
        date: new Date().toISOString().split("T")[0],
        progress: 0,
        hoursWorked: "",
        workDescription: "",
        blockers: "",
        nextPlan: "",
    });

    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");


    /* =========================================
       FETCH DATA
    ========================================= */

    const fetchData = async () => {
        try {
            setLoading(true);

            const [taskResponse, logResponse] = await Promise.all([
                getMyWork(),
                getMyWorkLogs(),
            ]);

            setTasks(taskResponse?.data || []);
            setWorkLogs(logResponse?.data || []);

        } catch (error) {
            console.error("My Work Error:", error);

            alert(
                error?.response?.data?.message ||
                "Failed to load your work."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);


    /* =========================================
       SUMMARY
    ========================================= */

    const summary = useMemo(() => {
        const total = tasks.length;

        const pending = tasks.filter(
            (task) => task.status === "pending"
        ).length;

        const inProgress = tasks.filter(
            (task) => task.status === "in_progress"
        ).length;

        const completed = tasks.filter(
            (task) => task.status === "completed"
        ).length;

        const overdue = tasks.filter((task) => {
            if (!task.deadline) return false;

            return (
                new Date(task.deadline) < new Date() &&
                task.status !== "completed" &&
                task.status !== "cancelled"
            );
        }).length;

        return {
            total,
            pending,
            inProgress,
            completed,
            overdue,
        };
    }, [tasks]);


    /* =========================================
       FILTER TASKS
    ========================================= */

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {

            const searchText = search.toLowerCase();

            const matchesSearch =
                task.title?.toLowerCase().includes(searchText) ||
                task.description?.toLowerCase().includes(searchText);

            const matchesStatus =
                statusFilter === "all" ||
                task.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [tasks, search, statusFilter]);


    /* =========================================
       FORMAT DATE
    ========================================= */

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };


    /* =========================================
       OPEN PROGRESS MODAL
    ========================================= */

    const openProgressModal = (task) => {
        setSelectedTask(task);

        setProgressData({
            progress: task.progress || 0,
            status: task.status || "pending",
            remarks: task.remarks || "",
        });

        setShowProgressModal(true);
    };


    /* =========================================
       UPDATE PROGRESS
    ========================================= */

    const handleProgressChange = (value) => {

        const progress = Number(value);

        let status = "pending";

        if (progress === 100) {
            status = "completed";
        } else if (progress > 0) {
            status = "in_progress";
        }

        setProgressData({
            ...progressData,
            progress,
            status,
        });
    };


    const handleUpdateProgress = async (e) => {
        e.preventDefault();

        if (!selectedTask) return;

        try {
            setSaving(true);

            await updateWorkProgress(
                selectedTask._id,
                {
                    progress: Number(progressData.progress),
                    remarks: progressData.remarks,
                }
            );

            alert("Progress updated successfully.");

            setShowProgressModal(false);
            setSelectedTask(null);

            await fetchData();

        } catch (error) {
            console.error(error);

            alert(
                error?.response?.data?.message ||
                "Failed to update progress."
            );
        } finally {
            setSaving(false);
        }
    };


    /* =========================================
       OPEN DAILY LOG
    ========================================= */

    const openLogModal = (task = null) => {

        setLogForm({
            task: task?._id || "",
            date: new Date().toISOString().split("T")[0],
            progress: task?.progress || 0,
            hoursWorked: "",
            workDescription: "",
            blockers: "",
            nextPlan: "",
        });

        setShowLogModal(true);
    };


    /* =========================================
       SUBMIT DAILY LOG
    ========================================= */

    const handleLogSubmit = async (e) => {
        e.preventDefault();

        if (!logForm.task) {
            alert("Please select a task.");
            return;
        }

        if (!logForm.workDescription.trim()) {
            alert("Please enter today's work description.");
            return;
        }

        try {
            setSaving(true);

            await createWorkLog({
                task: logForm.task,
                date: logForm.date,
                progress: Number(logForm.progress),
                hoursWorked: Number(logForm.hoursWorked || 0),
                workDescription: logForm.workDescription,
                blockers: logForm.blockers,
                nextPlan: logForm.nextPlan,
            });

            alert("Daily work log submitted successfully.");

            setShowLogModal(false);

            await fetchData();

        } catch (error) {
            console.error(error);

            alert(
                error?.response?.data?.message ||
                "Failed to submit work log."
            );
        } finally {
            setSaving(false);
        }
    };


    /* =========================================
       LOADING
    ========================================= */

    if (loading) {
        return (
            <div className="my-work-loading">
                <div className="loading-spinner"></div>
                <p>Loading your work...</p>
            </div>
        );
    }


    return (
        <div className="my-work-page">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="my-work-header">

                <div>
                    <h1>My Work</h1>

                    <p>
                        Manage your assigned tasks and daily work updates.
                    </p>
                </div>

                <button
                    className="primary-btn"
                    onClick={() => openLogModal()}
                >
                    <i className="bi bi-journal-plus"></i>
                    Daily Work Log
                </button>

            </div>


            {/* =========================================
                SUMMARY CARDS
            ========================================= */}

            <div className="work-summary-grid">

                <div className="work-summary-card">
                    <div className="summary-icon">
                        <i className="bi bi-clipboard-check"></i>
                    </div>

                    <div>
                        <span>Total Tasks</span>
                        <strong>{summary.total}</strong>
                    </div>
                </div>


                <div className="work-summary-card">
                    <div className="summary-icon">
                        <i className="bi bi-hourglass-split"></i>
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>{summary.pending}</strong>
                    </div>
                </div>


                <div className="work-summary-card">
                    <div className="summary-icon">
                        <i className="bi bi-arrow-repeat"></i>
                    </div>

                    <div>
                        <span>In Progress</span>
                        <strong>{summary.inProgress}</strong>
                    </div>
                </div>


                <div className="work-summary-card">
                    <div className="summary-icon">
                        <i className="bi bi-check-circle"></i>
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>{summary.completed}</strong>
                    </div>
                </div>


                <div className="work-summary-card overdue-card">
                    <div className="summary-icon">
                        <i className="bi bi-exclamation-circle"></i>
                    </div>

                    <div>
                        <span>Overdue</span>
                        <strong>{summary.overdue}</strong>
                    </div>
                </div>

            </div>


            {/* =========================================
                TASK SECTION
            ========================================= */}

            <div className="work-section">

                <div className="section-header">

                    <div>
                        <h2>Assigned Tasks</h2>
                        <p>Your current assigned work.</p>
                    </div>

                </div>


                {/* Filters */}

                <div className="work-filters">

                    <div className="search-box">

                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>


                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
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

                </div>


                {/* Task Cards */}

                {filteredTasks.length === 0 ? (

                    <div className="empty-work">

                        <i className="bi bi-clipboard-x"></i>

                        <h3>No Tasks Found</h3>

                        <p>
                            You don't have any assigned tasks matching
                            the selected filters.
                        </p>

                    </div>

                ) : (

                    <div className="task-list">

                        {filteredTasks.map((task) => {

                            const isOverdue =
                                task.deadline &&
                                new Date(task.deadline) < new Date() &&
                                task.status !== "completed" &&
                                task.status !== "cancelled";

                            return (

                                <div
                                    className="task-card"
                                    key={task._id}
                                >

                                    <div className="task-card-top">

                                        <div>

                                            <h3>
                                                {task.title}
                                            </h3>

                                            <p>
                                                {task.description ||
                                                    "No description provided."}
                                            </p>

                                        </div>


                                        <span
                                            className={`priority-badge priority-${task.priority}`}
                                        >
                                            {task.priority}
                                        </span>

                                    </div>


                                    <div className="task-meta">

                                        <div>
                                            <span>Start Date</span>
                                            <strong>
                                                {formatDate(
                                                    task.startDate
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Deadline</span>

                                            <strong
                                                className={
                                                    isOverdue
                                                        ? "deadline-overdue"
                                                        : ""
                                                }
                                            >
                                                {formatDate(
                                                    task.deadline
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Status</span>

                                            <span
                                                className={`status-badge status-${task.status}`}
                                            >
                                                {task.status
                                                    ?.replace(
                                                        "_",
                                                        " "
                                                    )}
                                            </span>
                                        </div>

                                    </div>


                                    {/* Progress */}

                                    <div className="task-progress">

                                        <div className="progress-header">

                                            <span>
                                                Progress
                                            </span>

                                            <strong>
                                                {task.progress || 0}%
                                            </strong>

                                        </div>

                                        <div className="progress-bar">

                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${task.progress || 0}%`,
                                                }}
                                            ></div>

                                        </div>

                                    </div>


                                    {/* Actions */}

                                    <div className="task-actions">

                                        <button
                                            className="secondary-btn"
                                            onClick={() =>
                                                openProgressModal(task)
                                            }
                                            disabled={
                                                task.status ===
                                                "completed"
                                            }
                                        >
                                            <i className="bi bi-pencil-square"></i>
                                            Update Progress
                                        </button>


                                        <button
                                            className="secondary-btn"
                                            onClick={() =>
                                                openLogModal(task)
                                            }
                                        >
                                            <i className="bi bi-journal-text"></i>
                                            Add Daily Log
                                        </button>

                                    </div>

                                </div>

                            );
                        })}

                    </div>

                )}

            </div>


            {/* =========================================
                WORK LOGS
            ========================================= */}

            <div className="work-section">

                <div className="section-header">

                    <div>
                        <h2>My Daily Work Logs</h2>

                        <p>
                            Your submitted daily work updates.
                        </p>
                    </div>

                </div>


                {workLogs.length === 0 ? (

                    <div className="empty-work small-empty">

                        <i className="bi bi-journal-x"></i>

                        <h3>No Work Logs Yet</h3>

                        <p>
                            Start submitting your daily work updates.
                        </p>

                    </div>

                ) : (

                    <div className="work-log-list">

                        {workLogs.map((log) => (

                            <div
                                className="work-log-card"
                                key={log._id}
                            >

                                <div className="work-log-header">

                                    <div>

                                        <h3>
                                            {log.task?.title ||
                                                "Task"}
                                        </h3>

                                        <span>
                                            {formatDate(log.date)}
                                        </span>

                                    </div>

                                    <strong>
                                        {log.progress}%
                                    </strong>

                                </div>


                                <div className="work-log-details">

                                    <div>
                                        <span>
                                            Hours Worked
                                        </span>

                                        <strong>
                                            {log.hoursWorked || 0}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Work Done
                                        </span>

                                        <p>
                                            {log.workDescription}
                                        </p>
                                    </div>


                                    {log.blockers && (
                                        <div>
                                            <span>
                                                Blockers
                                            </span>

                                            <p>
                                                {log.blockers}
                                            </p>
                                        </div>
                                    )}


                                    {log.nextPlan && (
                                        <div>
                                            <span>
                                                Next Plan
                                            </span>

                                            <p>
                                                {log.nextPlan}
                                            </p>
                                        </div>
                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>


            {/* =========================================
                UPDATE PROGRESS MODAL
            ========================================= */}

            {showProgressModal && (

                <div className="modal-overlay">

                    <div className="work-modal">

                        <div className="modal-header">

                            <div>
                                <h2>Update Progress</h2>

                                <p>
                                    {selectedTask?.title}
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowProgressModal(false)
                                }
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>


                        <form
                            onSubmit={handleUpdateProgress}
                        >

                            <div className="progress-value">
                                {progressData.progress}%
                            </div>


                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={progressData.progress}
                                onChange={(e) =>
                                    handleProgressChange(
                                        e.target.value
                                    )
                                }
                            />


                            <div className="range-labels">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>


                            <div className="form-group">

                                <label>
                                    Remarks
                                </label>

                                <textarea
                                    rows="4"
                                    value={
                                        progressData.remarks
                                    }
                                    onChange={(e) =>
                                        setProgressData({
                                            ...progressData,
                                            remarks:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Add any remarks..."
                                />

                            </div>


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                        setShowProgressModal(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Updating..."
                                        : "Update Progress"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* =========================================
                DAILY LOG MODAL
            ========================================= */}

            {showLogModal && (

                <div className="modal-overlay">

                    <div className="work-modal large-modal">

                        <div className="modal-header">

                            <div>
                                <h2>Daily Work Log</h2>

                                <p>
                                    Submit today's work update.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowLogModal(false)
                                }
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>


                        <form
                            onSubmit={handleLogSubmit}
                        >

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Task *
                                    </label>

                                    <select
                                        value={logForm.task}
                                        onChange={(e) =>
                                            setLogForm({
                                                ...logForm,
                                                task: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">
                                            Select Task
                                        </option>

                                        {tasks
                                            .filter(
                                                (task) =>
                                                    task.status !==
                                                    "completed" &&
                                                    task.status !==
                                                    "cancelled"
                                            )
                                            .map((task) => (

                                                <option
                                                    key={task._id}
                                                    value={task._id}
                                                >
                                                    {task.title}
                                                </option>

                                            ))}
                                    </select>

                                </div>


                                <div className="form-group">

                                    <label>
                                        Date *
                                    </label>

                                    <input
                                        type="date"
                                        value={logForm.date}
                                        onChange={(e) =>
                                            setLogForm({
                                                ...logForm,
                                                date: e.target.value,
                                            })
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Progress *
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={logForm.progress}
                                        onChange={(e) =>
                                            setLogForm({
                                                ...logForm,
                                                progress:
                                                    e.target.value,
                                            })
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Hours Worked
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={
                                            logForm.hoursWorked
                                        }
                                        onChange={(e) =>
                                            setLogForm({
                                                ...logForm,
                                                hoursWorked:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="e.g. 6.5"
                                    />

                                </div>

                            </div>


                            <div className="form-group">

                                <label>
                                    Work Description *
                                </label>

                                <textarea
                                    rows="4"
                                    value={
                                        logForm.workDescription
                                    }
                                    onChange={(e) =>
                                        setLogForm({
                                            ...logForm,
                                            workDescription:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="What did you work on today?"
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Blockers
                                </label>

                                <textarea
                                    rows="3"
                                    value={
                                        logForm.blockers
                                    }
                                    onChange={(e) =>
                                        setLogForm({
                                            ...logForm,
                                            blockers:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="Any issue or blocker?"
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Next Plan
                                </label>

                                <textarea
                                    rows="3"
                                    value={
                                        logForm.nextPlan
                                    }
                                    onChange={(e) =>
                                        setLogForm({
                                            ...logForm,
                                            nextPlan:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="What will you work on next?"
                                />

                            </div>


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                        setShowLogModal(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Submitting..."
                                        : "Submit Work Log"}
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