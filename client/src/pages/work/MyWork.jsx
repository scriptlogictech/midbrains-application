import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
    getMyWork,
    updateWorkProgress,
    createSelfWork,
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
        startTime: "",
        endTime: "",
        hoursWorked: "",
        workDescription: "",
        blockers: "",
        nextPlan: "",
    });

    /* =========================================
       SELF WORK FORM
    ========================================= */

    const [selfWorkForm, setSelfWorkForm] = useState({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        startTime: "",
        endTime: "",
        hoursWorked: "",
        progress: 0,
        priority: "medium",
        remarks: "",
    });

    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showSelfWorkModal, setShowSelfWorkModal] =
        useState(false);

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

            console.log("My Work Response:", taskResponse);
            console.log("My Work Logs Response:", logResponse);

            setTasks(
                taskResponse?.tasks ||
                taskResponse?.data ||
                []
            );

            setWorkLogs(
                logResponse?.logs ||
                logResponse?.data ||
                []
            );

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
       FORMAT TIME
    ========================================= */

    const formatTime = (time) => {
        if (!time) return "-";

        const [hours, minutes] = time.split(":");

        const date = new Date();

        date.setHours(
            Number(hours),
            Number(minutes),
            0,
            0
        );

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };


    /* =========================================
       CALCULATE HOURS
    ========================================= */

    const calculateHours = (startTime, endTime) => {
        if (!startTime || !endTime) {
            return "";
        }

        const startParts = startTime.split(":");
        const endParts = endTime.split(":");

        if (
            startParts.length !== 2 ||
            endParts.length !== 2
        ) {
            return "";
        }

        const startMinutes =
            Number(startParts[0]) * 60 +
            Number(startParts[1]);

        const endMinutes =
            Number(endParts[0]) * 60 +
            Number(endParts[1]);

        const difference =
            endMinutes - startMinutes;

        // End time must be later than start time.
        if (difference <= 0) {
            return "";
        }

        return Number(
            (difference / 60).toFixed(2)
        );
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
                    progress: Number(
                        progressData.progress
                    ),
                    remarks:
                        progressData.remarks,
                }
            );

            alert(
                "Progress updated successfully."
            );

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
            date: new Date()
                .toISOString()
                .split("T")[0],
            progress: task?.progress || 0,
            startTime: "",
            endTime: "",
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

        if (!logForm.date) {
            alert("Please select work date.");
            return;
        }

        if (!logForm.startTime || !logForm.endTime) {
            alert("Please select start time and end time.");
            return;
        }

        const calculatedHours = calculateHours(
            logForm.startTime,
            logForm.endTime
        );

        if (calculatedHours === "" || Number(calculatedHours) <= 0) {
            alert("End time must be later than start time.");
            return;
        }

        if (!logForm.workDescription.trim()) {
            alert(
                "Please enter today's work description."
            );
            return;
        }

        try {
            setSaving(true);

            await createWorkLog({
                task: logForm.task,
                date: logForm.date,
                progress: Number(
                    logForm.progress
                ),
                startTime: logForm.startTime,
                endTime: logForm.endTime,
                hoursWorked: Number(calculatedHours),
                workDescription:
                    logForm.workDescription,
                blockers: logForm.blockers,
                nextPlan: logForm.nextPlan,
            });

            alert(
                "Daily work log submitted successfully."
            );

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
       SELF WORK FORM CHANGE
    ========================================= */

    const handleSelfWorkChange = (e) => {
        const { name, value } = e.target;

        setSelfWorkForm((prev) => {
            const updatedForm = {
                ...prev,
                [name]: value,
            };

            /*
             * Automatically calculate hours
             * whenever start/end time changes.
             */
            if (
                name === "startTime" ||
                name === "endTime"
            ) {
                updatedForm.hoursWorked =
                    calculateHours(
                        name === "startTime"
                            ? value
                            : prev.startTime,
                        name === "endTime"
                            ? value
                            : prev.endTime
                    );
            }

            return updatedForm;
        });
    };


    /* =========================================
       OPEN SELF WORK MODAL
    ========================================= */

    const openSelfWorkModal = () => {
        setSelfWorkForm({
            title: "",
            description: "",
            date: new Date()
                .toISOString()
                .split("T")[0],
            startTime: "",
            endTime: "",
            hoursWorked: "",
            progress: 0,
            priority: "medium",
            remarks: "",
        });

        setShowSelfWorkModal(true);
    };


    /* =========================================
       SUBMIT SELF WORK
    ========================================= */

    const handleSelfWorkSubmit = async (e) => {
        e.preventDefault();

        if (!selfWorkForm.title.trim()) {
            alert("Please enter work title.");
            return;
        }

        if (!selfWorkForm.date) {
            alert("Please select work date.");
            return;
        }

        if (!selfWorkForm.startTime) {
            alert("Please select start time.");
            return;
        }

        if (!selfWorkForm.endTime) {
            alert("Please select end time.");
            return;
        }

        const calculatedHours =
            calculateHours(
                selfWorkForm.startTime,
                selfWorkForm.endTime
            );

        if (
            calculatedHours === "" ||
            Number(calculatedHours) <= 0
        ) {
            alert(
                "End time must be different from start time."
            );
            return;
        }

        try {
            setSaving(true);

            const response =
                await createSelfWork({
                    title:
                        selfWorkForm.title.trim(),

                    description:
                        selfWorkForm.description.trim(),

                    date:
                        selfWorkForm.date,

                    startTime:
                        selfWorkForm.startTime,

                    endTime:
                        selfWorkForm.endTime,

                    hoursWorked:
                        Number(calculatedHours),

                    progress:
                        Number(
                            selfWorkForm.progress
                        ),

                    priority:
                        selfWorkForm.priority,

                    remarks:
                        selfWorkForm.remarks.trim(),
                });

            alert(
                response?.message ||
                "Your work has been added successfully."
            );

            setShowSelfWorkModal(false);

            await fetchData();

        } catch (error) {
            console.error(
                "Create Self Work Error:",
                error
            );

            alert(
                error?.response?.data?.message ||
                "Failed to add your work."
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

                <p>
                    Loading your work...
                </p>
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
                        Manage your assigned tasks and
                        record your daily work.
                    </p>
                </div>


                <div className="header-actions">

                    <button
                        className="secondary-btn"
                        onClick={openSelfWorkModal}
                    >
                        <i className="bi bi-plus-circle"></i>

                        Add My Work
                    </button>


                    <button
                        className="primary-btn"
                        onClick={() =>
                            openLogModal()
                        }
                    >
                        <i className="bi bi-journal-plus"></i>

                        Daily Work Log
                    </button>

                </div>

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
                        <span>
                            Total Tasks
                        </span>

                        <strong>
                            {summary.total}
                        </strong>
                    </div>

                </div>


                <div className="work-summary-card">

                    <div className="summary-icon">
                        <i className="bi bi-hourglass-split"></i>
                    </div>

                    <div>
                        <span>
                            Pending
                        </span>

                        <strong>
                            {summary.pending}
                        </strong>
                    </div>

                </div>


                <div className="work-summary-card">

                    <div className="summary-icon">
                        <i className="bi bi-arrow-repeat"></i>
                    </div>

                    <div>
                        <span>
                            In Progress
                        </span>

                        <strong>
                            {summary.inProgress}
                        </strong>
                    </div>

                </div>


                <div className="work-summary-card">

                    <div className="summary-icon">
                        <i className="bi bi-check-circle"></i>
                    </div>

                    <div>
                        <span>
                            Completed
                        </span>

                        <strong>
                            {summary.completed}
                        </strong>
                    </div>

                </div>


                <div className="work-summary-card overdue-card">

                    <div className="summary-icon">
                        <i className="bi bi-exclamation-circle"></i>
                    </div>

                    <div>
                        <span>
                            Overdue
                        </span>

                        <strong>
                            {summary.overdue}
                        </strong>
                    </div>

                </div>

            </div>


            {/* =========================================
                ASSIGNED TASK SECTION
            ========================================= */}

            <div className="work-section">

                <div className="section-header">

                    <div>
                        <h2>
                            Assigned Tasks
                        </h2>

                        <p>
                            Tasks assigned to you by the
                            administrator.
                        </p>
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

                        <option value="all">
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

                </div>


                {/* Task Cards */}

                {filteredTasks.length === 0 ? (

                    <div className="empty-work">

                        <i className="bi bi-clipboard-x"></i>

                        <h3>
                            No Assigned Tasks
                        </h3>

                        <p>
                            You don't have any assigned
                            tasks matching the selected
                            filters.
                        </p>

                    </div>

                ) : (

                    <div className="task-list">

                        {filteredTasks.map(
                            (task) => {

                                const isOverdue =
                                    task.deadline &&
                                    new Date(
                                        task.deadline
                                    ) < new Date() &&
                                    task.status !==
                                        "completed" &&
                                    task.status !==
                                        "cancelled";

                                return (

                                    <div
                                        className="task-card"
                                        key={
                                            task._id
                                        }
                                    >

                                        <div className="task-card-top">

                                            <div>

                                                <div className="task-title-row">

                                                    <h3>
                                                        {
                                                            task.title
                                                        }
                                                    </h3>

                                                    {task.workType ===
                                                        "self" && (
                                                        <span className="self-work-badge">
                                                            My Work
                                                        </span>
                                                    )}

                                                </div>

                                                <p>
                                                    {
                                                        task.description ||
                                                        "No description provided."
                                                    }
                                                </p>

                                            </div>


                                            <span
                                                className={`priority-badge priority-${task.priority}`}
                                            >
                                                {
                                                    task.priority
                                                }
                                            </span>

                                        </div>


                                        <div className="task-meta">

                                            <div>

                                                <span>
                                                    Start Date
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        task.startDate
                                                    )}
                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    Deadline
                                                </span>

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

                                                <span>
                                                    Status
                                                </span>

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


                                        {/* SELF WORK TIME */}

                                        {task.workType ===
                                            "self" && (
                                            <div className="self-work-time">

                                                <div>

                                                    <span>
                                                        Start Time
                                                    </span>

                                                    <strong>
                                                        {formatTime(
                                                            task.startTime
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        End Time
                                                    </span>

                                                    <strong>
                                                        {formatTime(
                                                            task.endTime
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        Hours Worked
                                                    </span>

                                                    <strong>
                                                        {
                                                            task.hoursWorked
                                                        }{" "}
                                                        hrs
                                                    </strong>

                                                </div>

                                            </div>
                                        )}


                                        {/* Progress */}

                                        <div className="task-progress">

                                            <div className="progress-header">

                                                <span>
                                                    Progress
                                                </span>

                                                <strong>
                                                    {
                                                        task.progress ||
                                                        0
                                                    }%
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
                                                    openProgressModal(
                                                        task
                                                    )
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
                                                    openLogModal(
                                                        task
                                                    )
                                                }
                                            >
                                                <i className="bi bi-journal-text"></i>

                                                Add Daily Log
                                            </button>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </div>


            {/* =========================================
                MY DAILY WORK LOGS
            ========================================= */}

            <div className="work-section">

                <div className="section-header">

                    <div>

                        <h2>
                            My Daily Work Logs
                        </h2>

                        <p>
                            Your submitted daily work
                            updates.
                        </p>

                    </div>

                </div>


                {workLogs.length === 0 ? (

                    <div className="empty-work small-empty">

                        <i className="bi bi-journal-x"></i>

                        <h3>
                            No Work Logs Yet
                        </h3>

                        <p>
                            Start submitting your daily
                            work updates.
                        </p>

                    </div>

                ) : (

                    <div className="work-log-list">

                        {workLogs.map(
                            (log) => (

                                <div
                                    className="work-log-card"
                                    key={
                                        log._id
                                    }
                                >

                                    <div className="work-log-header">

                                        <div>

                                            <h3>
                                                {
                                                    log.task
                                                        ?.title ||
                                                    "Task"
                                                }
                                            </h3>

                                            <span>
                                                {formatDate(
                                                    log.date
                                                )}
                                            </span>

                                        </div>

                                        <strong>
                                            {
                                                log.progress
                                            }%
                                        </strong>

                                    </div>


                                    <div className="work-log-details">

                                        <div>

                                            <span>
                                                Work Time
                                            </span>

                                            <strong>
                                                {formatTime(log.startTime)}
                                                {" - "}
                                                {formatTime(log.endTime)}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Hours Worked
                                            </span>

                                            <strong>
                                                {
                                                    log.hoursWorked ||
                                                    0
                                                }
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Work Done
                                            </span>

                                            <p>
                                                {
                                                    log.workDescription
                                                }
                                            </p>

                                        </div>


                                        {log.blockers && (
                                            <div>

                                                <span>
                                                    Blockers
                                                </span>

                                                <p>
                                                    {
                                                        log.blockers
                                                    }
                                                </p>

                                            </div>
                                        )}


                                        {log.nextPlan && (
                                            <div>

                                                <span>
                                                    Next Plan
                                                </span>

                                                <p>
                                                    {
                                                        log.nextPlan
                                                    }
                                                </p>

                                            </div>
                                        )}

                                    </div>

                                </div>

                            )
                        )}

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

                                <h2>
                                    Update Progress
                                </h2>

                                <p>
                                    {
                                        selectedTask?.title
                                    }
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowProgressModal(
                                        false
                                    )
                                }
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleUpdateProgress
                            }
                        >

                            <div className="progress-value">
                                {
                                    progressData.progress
                                }%
                            </div>


                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={
                                    progressData.progress
                                }
                                onChange={(e) =>
                                    handleProgressChange(
                                        e.target.value
                                    )
                                }
                            />


                            <div className="range-labels">

                                <span>
                                    0%
                                </span>

                                <span>
                                    50%
                                </span>

                                <span>
                                    100%
                                </span>

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
                                                e.target
                                                    .value,
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
                                        setShowProgressModal(
                                            false
                                        )
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

                                <h2>
                                    Daily Work Log
                                </h2>

                                <p>
                                    Submit today's work
                                    update.
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowLogModal(
                                        false
                                    )
                                }
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleLogSubmit
                            }
                        >

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Task *
                                    </label>

                                    <select
                                        value={
                                            logForm.task
                                        }
                                        onChange={(e) =>
                                            setLogForm({
                                                ...logForm,
                                                task: e.target
                                                    .value,
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
                                            .map(
                                                (task) => (

                                                    <option
                                                        key={
                                                            task._id
                                                        }
                                                        value={
                                                            task._id
                                                        }
                                                    >
                                                        {
                                                            task.title
                                                        }
                                                    </option>

                                                )
                                            )}

                                    </select>

                                </div>


                                <div className="form-group">

                                    <label>
                                        Date *
                                    </label>

                                    <input
                                        type="date"
                                        value={
                                            logForm.date
                                        }
                                        onChange={(e) =>
                                            setLogForm({
                                                ...logForm,
                                                date: e.target
                                                    .value,
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
                                        value={
                                            logForm.progress
                                        }
                                        onChange={(e) =>
                                            setLogForm({
                                                ...logForm,
                                                progress:
                                                    e.target
                                                        .value,
                                            })
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Start Time *
                                    </label>

                                    <input
                                        type="time"
                                        value={logForm.startTime}
                                        onChange={(e) => {
                                            const startTime = e.target.value;

                                            setLogForm((prev) => ({
                                                ...prev,
                                                startTime,
                                                hoursWorked: calculateHours(
                                                    startTime,
                                                    prev.endTime
                                                ),
                                            }));
                                        }}
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        End Time *
                                    </label>

                                    <input
                                        type="time"
                                        value={logForm.endTime}
                                        onChange={(e) => {
                                            const endTime = e.target.value;

                                            setLogForm((prev) => ({
                                                ...prev,
                                                endTime,
                                                hoursWorked: calculateHours(
                                                    prev.startTime,
                                                    endTime
                                                ),
                                            }));
                                        }}
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Hours Worked
                                    </label>

                                    <input
                                        type="number"
                                        value={logForm.hoursWorked}
                                        readOnly
                                        placeholder="Auto calculated"
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
                                                e.target
                                                    .value,
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
                                                e.target
                                                    .value,
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
                                                e.target
                                                    .value,
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
                                        setShowLogModal(
                                            false
                                        )
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


            {/* =========================================
                ADD MY WORK MODAL
            ========================================= */}

            {showSelfWorkModal && (

                <div className="modal-overlay">

                    <div className="work-modal large-modal">

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Add My Work
                                </h2>

                                <p>
                                    Record work you completed
                                    yourself.
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowSelfWorkModal(
                                        false
                                    )
                                }
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleSelfWorkSubmit
                            }
                        >

                            {/* Work Title */}

                            <div className="form-group">

                                <label>
                                    Work Title *
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={
                                        selfWorkForm.title
                                    }
                                    onChange={
                                        handleSelfWorkChange
                                    }
                                    placeholder="e.g. Developed Login API"
                                    required
                                />

                            </div>


                            {/* Description */}

                            <div className="form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    rows="3"
                                    name="description"
                                    value={
                                        selfWorkForm.description
                                    }
                                    onChange={
                                        handleSelfWorkChange
                                    }
                                    placeholder="Describe what you worked on..."
                                />

                            </div>


                            {/* Date / Time */}

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Work Date *
                                    </label>

                                    <input
                                        type="date"
                                        name="date"
                                        value={
                                            selfWorkForm.date
                                        }
                                        onChange={
                                            handleSelfWorkChange
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Start Time *
                                    </label>

                                    <input
                                        type="time"
                                        name="startTime"
                                        value={
                                            selfWorkForm.startTime
                                        }
                                        onChange={
                                            handleSelfWorkChange
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        End Time *
                                    </label>

                                    <input
                                        type="time"
                                        name="endTime"
                                        value={
                                            selfWorkForm.endTime
                                        }
                                        onChange={
                                            handleSelfWorkChange
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
                                        value={
                                            selfWorkForm.hoursWorked
                                        }
                                        readOnly
                                        placeholder="Automatically calculated"
                                    />

                                </div>

                            </div>


                            {/* Progress / Priority */}

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>
                                        Progress (%)
                                    </label>

                                    <input
                                        type="number"
                                        name="progress"
                                        min="0"
                                        max="100"
                                        value={
                                            selfWorkForm.progress
                                        }
                                        onChange={
                                            handleSelfWorkChange
                                        }
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Priority
                                    </label>

                                    <select
                                        name="priority"
                                        value={
                                            selfWorkForm.priority
                                        }
                                        onChange={
                                            handleSelfWorkChange
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

                            </div>


                            {/* Remarks */}

                            <div className="form-group">

                                <label>
                                    Remarks
                                </label>

                                <textarea
                                    rows="3"
                                    name="remarks"
                                    value={
                                        selfWorkForm.remarks
                                    }
                                    onChange={
                                        handleSelfWorkChange
                                    }
                                    placeholder="Any additional notes..."
                                />

                            </div>


                            {/* Actions */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                        setShowSelfWorkModal(
                                            false
                                        )
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="button-spinner"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>
                                            Save My Work
                                        </>
                                    )}
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