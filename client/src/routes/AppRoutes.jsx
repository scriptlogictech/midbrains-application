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

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>

                {/* Login */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Company Selection */}
                <Route
                    path="/companies"
                    element={<CompanySelection />}
                />

                {/* Dashboard */}
                <Route
                    path="/dashboard/:companyId"
                    element={
                        <DashboardLayout>
                            <Dashboard />
                        </DashboardLayout>
                    }
                />

                {/* Leads */}
                <Route
                    path="/dashboard/:companyId/leads"
                    element={
                        <DashboardLayout>
                            <Leads />
                        </DashboardLayout>
                    }
                />


                <Route
                    path="/dashboard/:companyId/followups"
                    element={
                        <DashboardLayout>
                            <Followups />
                        </DashboardLayout>
                    }
                />

                <Route
                    path="/dashboard/:companyId/admissions"
                    element={
                        <DashboardLayout>
                            <Admissions />
                        </DashboardLayout>
                    }
                />


                <Route
                    path="/dashboard/:companyId/internships"
                    element={
                        <DashboardLayout>
                            <Internships />
                        </DashboardLayout>
                    }
                />

                <Route
                    path="/dashboard/:companyId/corporate-training"
                    element={
                        <DashboardLayout>
                            <CorporateTraining />
                        </DashboardLayout>
                    }
                />

                <Route
                    path="/dashboard/:companyId/projects"
                    element={
                        <DashboardLayout>
                            <Projects />
                        </DashboardLayout>
                    }
                />

                <Route
                    path="/dashboard/:companyId/placements"
                    element={
                        <DashboardLayout>
                            <Placements />
                        </DashboardLayout>
                    }
                />

                <Route
                    path="/dashboard/:companyId/reports"
                    element={

                        <DashboardLayout>
                            <Reports />
                        </DashboardLayout>

                    }
                />

                <Route
                    path="/dashboard/:companyId/users"
                    element={
                        
                            <DashboardLayout>
                                <Users />
                            </DashboardLayout>
                            
                    }
                />

                {/* Default */}
                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                {/* Unknown */}
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