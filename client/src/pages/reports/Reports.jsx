import React, { useEffect, useState } from "react";
import {
    getDashboardReport,
    getLeadReport,
    getRevenueReport,
    getPlacementReport,
} from "../../services/reportService";

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [dashboard, setDashboard] = useState({});
    const [leadReport, setLeadReport] = useState({});
    const [revenue, setRevenue] = useState({});
    const [placement, setPlacement] = useState({});

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                dashboardResponse,
                leadResponse,
                revenueResponse,
                placementResponse,
            ] = await Promise.all([
                getDashboardReport(),
                getLeadReport(),
                getRevenueReport(),
                getPlacementReport(),
            ]);

            setDashboard(
                dashboardResponse?.data ||
                dashboardResponse?.summary ||
                dashboardResponse ||
                {}
            );

            setLeadReport(
                leadResponse?.data ||
                leadResponse?.report ||
                leadResponse ||
                {}
            );

            setRevenue(
                revenueResponse?.data ||
                revenueResponse?.revenue ||
                revenueResponse ||
                {}
            );

            setPlacement(
                placementResponse?.data ||
                placementResponse?.report ||
                placementResponse ||
                {}
            );
        } catch (err) {
            console.error("Reports Error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load reports"
            );
        } finally {
            setLoading(false);
        }
    };

    const getValue = (obj, keys) => {
        for (const key of keys) {
            if (
                obj &&
                obj[key] !== undefined &&
                obj[key] !== null
            ) {
                return obj[key];
            }
        }

        return 0;
    };

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString("en-IN")}`;
    };

    if (loading) {
        return (
            <div className="reports-page">
                <div className="reports-loading">
                    <div className="spinner-border text-primary" />
                    <p>Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page">

            {/* Header */}
            <div className="reports-header">
                <div>
                    <h2>Reports & Analytics</h2>
                    <p>
                        Overview of leads, admissions, revenue and placements
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={fetchReports}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                </button>
            </div>

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            {/* Overall Summary */}
            <div className="report-section">
                <div className="section-title">
                    <h4>Overall Summary</h4>
                </div>

                <div className="report-card-grid">

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <i className="bi bi-buildings"></i>
                        </div>
                        <div>
                            <span>Total Companies</span>
                            <h3>
                                {getValue(dashboard, [
                                    "totalCompanies",
                                    "companies",
                                ])}
                            </h3>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <i className="bi bi-people"></i>
                        </div>
                        <div>
                            <span>Total Leads</span>
                            <h3>
                                {getValue(dashboard, [
                                    "totalLeads",
                                    "leads",
                                ])}
                            </h3>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <i className="bi bi-person-check"></i>
                        </div>
                        <div>
                            <span>Total Admissions</span>
                            <h3>
                                {getValue(dashboard, [
                                    "totalAdmissions",
                                    "admissions",
                                ])}
                            </h3>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <i className="bi bi-laptop"></i>
                        </div>
                        <div>
                            <span>Total Internships</span>
                            <h3>
                                {getValue(dashboard, [
                                    "totalInternships",
                                    "internships",
                                ])}
                            </h3>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <i className="bi bi-kanban"></i>
                        </div>
                        <div>
                            <span>Total Projects</span>
                            <h3>
                                {getValue(dashboard, [
                                    "totalProjects",
                                    "projects",
                                ])}
                            </h3>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <i className="bi bi-person-workspace"></i>
                        </div>
                        <div>
                            <span>Total Placements</span>
                            <h3>
                                {getValue(dashboard, [
                                    "totalPlacements",
                                    "placements",
                                ])}
                            </h3>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <i className="bi bi-building-check"></i>
                        </div>
                        <div>
                            <span>Corporate Trainings</span>
                            <h3>
                                {getValue(dashboard, [
                                    "totalCorporateTrainings",
                                    "corporateTrainings",
                                ])}
                            </h3>
                        </div>
                    </div>

                </div>
            </div>

            {/* Lead Report */}
            <div className="report-section">
                <div className="section-title">
                    <h4>Lead Report</h4>
                </div>

                <div className="report-grid">

                    <div className="analytics-card">
                        <div className="analytics-header">
                            <h5>Lead Status</h5>
                            <i className="bi bi-funnel"></i>
                        </div>

                        <div className="status-list">

                            <div className="status-row">
                                <span>
                                    <i className="bi bi-circle-fill text-primary"></i>
                                    New
                                </span>
                                <strong>
                                    {getValue(leadReport, ["new", "newLeads"])}
                                </strong>
                            </div>

                            <div className="status-row">
                                <span>
                                    <i className="bi bi-circle-fill text-info"></i>
                                    Follow Up
                                </span>
                                <strong>
                                    {getValue(leadReport, [
                                        "follow_up",
                                        "followUp",
                                        "followUpLeads",
                                    ])}
                                </strong>
                            </div>

                            <div className="status-row">
                                <span>
                                    <i className="bi bi-circle-fill text-success"></i>
                                    Converted
                                </span>
                                <strong>
                                    {getValue(leadReport, [
                                        "converted",
                                        "convertedLeads",
                                    ])}
                                </strong>
                            </div>

                            <div className="status-row">
                                <span>
                                    <i className="bi bi-circle-fill text-danger"></i>
                                    Closed
                                </span>
                                <strong>
                                    {getValue(leadReport, [
                                        "closed",
                                        "closedLeads",
                                    ])}
                                </strong>
                            </div>

                        </div>
                    </div>

                    <div className="analytics-card">
                        <div className="analytics-header">
                            <h5>Conversion Overview</h5>
                            <i className="bi bi-graph-up-arrow"></i>
                        </div>

                        <div className="conversion-box">

                            <div>
                                <span>Total Leads</span>
                                <h3>
                                    {getValue(leadReport, [
                                        "totalLeads",
                                        "total",
                                    ])}
                                </h3>
                            </div>

                            <div>
                                <span>Converted</span>
                                <h3>
                                    {getValue(leadReport, [
                                        "converted",
                                        "convertedLeads",
                                    ])}
                                </h3>
                            </div>

                            <div>
                                <span>Conversion Rate</span>
                                <h3>
                                    {getValue(leadReport, [
                                        "conversionRate",
                                        "conversionPercentage",
                                    ])}%
                                </h3>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* Revenue Report */}
            <div className="report-section">
                <div className="section-title">
                    <h4>Revenue Report</h4>
                </div>

                <div className="report-card-grid">

                    <div className="revenue-card">
                        <span>Admission Revenue</span>
                        <h3>
                            {formatCurrency(
                                getValue(revenue, [
                                    "admissionRevenue",
                                    "admissions",
                                ])
                            )}
                        </h3>
                    </div>

                    <div className="revenue-card">
                        <span>Project Revenue</span>
                        <h3>
                            {formatCurrency(
                                getValue(revenue, [
                                    "projectRevenue",
                                    "projects",
                                ])
                            )}
                        </h3>
                    </div>

                    <div className="revenue-card">
                        <span>Corporate Training</span>
                        <h3>
                            {formatCurrency(
                                getValue(revenue, [
                                    "corporateTrainingRevenue",
                                    "corporateTrainings",
                                ])
                            )}
                        </h3>
                    </div>

                    <div className="revenue-card total-revenue">
                        <span>Total Revenue</span>
                        <h3>
                            {formatCurrency(
                                getValue(revenue, [
                                    "totalRevenue",
                                    "total",
                                ])
                            )}
                        </h3>
                    </div>

                </div>
            </div>

            {/* Placement Report */}
            <div className="report-section">
                <div className="section-title">
                    <h4>Placement Report</h4>
                </div>

                <div className="report-grid">

                    <div className="analytics-card">
                        <div className="analytics-header">
                            <h5>Interview Status</h5>
                            <i className="bi bi-person-video3"></i>
                        </div>

                        <div className="status-list">

                            <div className="status-row">
                                <span>
                                    <i className="bi bi-circle-fill text-warning"></i>
                                    Pending
                                </span>
                                <strong>
                                    {getValue(placement, [
                                        "pending",
                                        "pendingPlacements",
                                    ])}
                                </strong>
                            </div>

                            <div className="status-row">
                                <span>
                                    <i className="bi bi-circle-fill text-success"></i>
                                    Selected
                                </span>
                                <strong>
                                    {getValue(placement, [
                                        "selected",
                                        "selectedPlacements",
                                    ])}
                                </strong>
                            </div>

                            <div className="status-row">
                                <span>
                                    <i className="bi bi-circle-fill text-danger"></i>
                                    Rejected
                                </span>
                                <strong>
                                    {getValue(placement, [
                                        "rejected",
                                        "rejectedPlacements",
                                    ])}
                                </strong>
                            </div>

                        </div>
                    </div>

                    <div className="analytics-card">
                        <div className="analytics-header">
                            <h5>Placement Overview</h5>
                            <i className="bi bi-bar-chart"></i>
                        </div>

                        <div className="conversion-box">

                            <div>
                                <span>Total</span>
                                <h3>
                                    {getValue(placement, [
                                        "totalPlacements",
                                        "total",
                                    ])}
                                </h3>
                            </div>

                            <div>
                                <span>Selected</span>
                                <h3>
                                    {getValue(placement, [
                                        "selected",
                                        "selectedPlacements",
                                    ])}
                                </h3>
                            </div>

                            <div>
                                <span>Placement Rate</span>
                                <h3>
                                    {getValue(placement, [
                                        "placementRate",
                                        "placementPercentage",
                                    ])}%
                                </h3>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default Reports;