import api from "./api";

// ==========================================
// Get All Users
// Super Admin only
// ==========================================

export const getUsers = async () => {
    const response = await api.get("/users");

    return response.data;
};


// ==========================================
// Get Users of a Company
// ==========================================

export const getCompanyUsers = async (companyId) => {
    const response = await api.get(
        `/users/company/${companyId}`
    );

    return response.data;
};


// ==========================================
// Get Company Employees & Interns
// ==========================================

export const getCompanyEmployeesAndInterns = async (
    companyId
) => {
    const response = await api.get(
        `/users/company/${companyId}`
    );

    const users = response.data?.users || [];

    return {
        ...response.data,
        users: users.filter(
            (user) =>
                user.role === "employee" ||
                user.role === "intern"
        ),
    };
};


// ==========================================
// Get Company Employees
// Backward-compatible function
// ==========================================

export const getCompanyCounselors = async (
    companyId
) => {
    const response = await api.get(
        `/users/company/${companyId}/counselors`
    );

    return response.data;
};


// ==========================================
// Create User
// Super Admin only
// ==========================================

export const createUser = async (userData) => {
    const response = await api.post(
        "/users",
        userData
    );

    return response.data;
};


// ==========================================
// Update User
// Super Admin only
// ==========================================

export const updateUser = async (
    userId,
    userData
) => {
    const response = await api.put(
        `/users/${userId}`,
        userData
    );

    return response.data;
};


// ==========================================
// Update User Status
// Super Admin only
// ==========================================

export const updateUserStatus = async (
    userId,
    isActive
) => {
    const response = await api.put(
        `/users/${userId}/status`,
        {
            isActive,
        }
    );

    return response.data;
};