import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import CompanySelection from "../pages/company/CompanySelection";

import Dashboard from "../pages/dashboard/Dashboard";
import Leads from "../pages/leads/Leads";

import DashboardLayout from "../layouts/DashboardLayout";

import Followups from "../pages/followups/Followups";

import Admissions from "../pages/admissions/Admissions";

import Internships from "../pages/internships/Internships";

import CorporateTraining from "../pages/corporateTraining/CorporateTraining";

import Projects from "../pages/projects/Projects";

import Placements from "../pages/placements/Placements";

import Reports from "../pages/reports/Reports";

import Users from "../pages/users/Users";

import InstagramReelData from "../pages/instagramReelData/InstagramReelData";

// Work Management
import WorkManagement from "../pages/work/WorkManagement";
import MyWork from "../pages/work/MyWork";

import { useAuth } from "../context/AuthContext";


// =====================================================
// ROLE PROTECTED ROUTE
// =====================================================

const RoleRoute = ({
    children,
    allowedRoles,
}) => {
    const {
        user,
        loading,
        isAuthenticated,
    } = useAuth();

    // =================================================
    // WAIT FOR AUTHENTICATION RESTORATION
    // =================================================
    // When the page is refreshed, AuthContext first
    // reads token/user from localStorage.
    //
    // We MUST wait until that process is finished
    // before redirecting to login.
    // =================================================

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: "500",
                }}
            >
                Loading...
            </div>
        );
    }

    // =================================================
    // NOT AUTHENTICATED
    // =================================================

    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    // =================================================
    // ROLE NOT ALLOWED
    // =================================================

    if (
        !allowedRoles.includes(
            user.role
        )
    ) {
        const companyId =
            user.company?._id ||
            user.company ||
            "";

        // If company exists, return user to dashboard
        if (companyId) {
            return (
                <Navigate
                    to={`/dashboard/${companyId}`}
                    replace
                />
            );
        }

        // If company is missing, go to login
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    // =================================================
    // AUTHORIZED
    // =================================================

    return children;
};


// =====================================================
// APPLICATION ROUTES
// =====================================================

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>

                {/* =================================================
                    LOGIN
                ================================================= */}

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* =================================================
                    COMPANY SELECTION
                ================================================= */}

                <Route
                    path="/companies"
                    element={
                        <CompanySelection />
                    }
                />


                {/* =================================================
                    DASHBOARD
                    Super Admin + Employee + Intern
                ================================================= */}

                <Route
                    path="/dashboard/:companyId"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                                "intern",
                            ]}
                        >
                            <DashboardLayout>
                                <Dashboard />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    LEADS
                    Super Admin + Employee + Intern
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/leads"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                                "intern",
                            ]}
                        >
                            <DashboardLayout>
                                <Leads />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    FOLLOW-UPS
                    Super Admin + Employee + Intern
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/followups"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                                "intern",
                            ]}
                        >
                            <DashboardLayout>
                                <Followups />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    ADMISSIONS
                    Super Admin + Employee
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/admissions"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                            ]}
                        >
                            <DashboardLayout>
                                <Admissions />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    INTERNSHIPS
                    Super Admin + Employee
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/internships"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                            ]}
                        >
                            <DashboardLayout>
                                <Internships />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    CORPORATE TRAINING
                    Super Admin + Employee
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/corporate-training"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                            ]}
                        >
                            <DashboardLayout>
                                <CorporateTraining />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    PROJECTS
                    Super Admin + Employee
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/projects"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                            ]}
                        >
                            <DashboardLayout>
                                <Projects />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    PLACEMENTS
                    Super Admin + Employee
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/placements"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                            ]}
                        >
                            <DashboardLayout>
                                <Placements />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    REPORTS
                    Super Admin + Employee
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/reports"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                            ]}
                        >
                            <DashboardLayout>
                                <Reports />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    USER MANAGEMENT
                    SUPER ADMIN ONLY
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/users"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                            ]}
                        >
                            <DashboardLayout>
                                <Users />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
    INSTAGRAM REEL DATA
    SUPER ADMIN + EMPLOYEE
================================================= */}

                <Route
                    path="/dashboard/:companyId/instagram-reel-data"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                                "employee",
                            ]}
                        >
                            <DashboardLayout>
                                <InstagramReelData />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    WORK MANAGEMENT
                    SUPER ADMIN ONLY
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/work"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "super_admin",
                            ]}
                        >
                            <DashboardLayout>
                                <WorkManagement />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    MY WORK
                    EMPLOYEE + INTERN
                ================================================= */}

                <Route
                    path="/dashboard/:companyId/my-work"
                    element={
                        <RoleRoute
                            allowedRoles={[
                                "employee",
                                "intern",
                            ]}
                        >
                            <DashboardLayout>
                                <MyWork />
                            </DashboardLayout>
                        </RoleRoute>
                    }
                />


                {/* =================================================
                    DEFAULT
                ================================================= */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />


                {/* =================================================
                    UNKNOWN ROUTE
                ================================================= */}

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;