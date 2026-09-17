
import api from "./api";

// ========================================
// EMPLOYEE / INTERN - CREATE WORK LOG
// ========================================

export const createWorkLog = async (logData) => {
  const response = await api.post(
    "/work-logs",
    logData
  );

  return response.data;
};


// ========================================
// EMPLOYEE / INTERN - GET MY WORK LOGS
// ========================================

export const getMyWorkLogs = async () => {
  const response = await api.get(
    "/work-logs/my-logs"
  );

  return response.data;
};


// ========================================
// SUPER ADMIN - GET ALL WORK LOGS
// ========================================

export const getAllWorkLogs = async (params = {}) => {
  const response = await api.get(
    "/work-logs",
    {
      params,
    }
  );

  return response.data;
};