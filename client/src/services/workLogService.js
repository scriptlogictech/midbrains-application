
import api from "./api";

// Create a work log
export const createWorkLog = async (data) => {
  const response = await api.post("/work-logs", data);
  return response.data;
};

// Get logged-in employee's/intern's work logs
export const getMyWorkLogs = async () => {
  const response = await api.get("/work-logs/my-logs");
  return response.data;
};

// Get all employees' and interns' work logs (Super Admin)
export const getAllWorkLogs = async () => {
  const response = await api.get("/work-logs");
  return response.data;
};

// Update a work log
export const updateWorkLog = async (id, data) => {
  const response = await api.put(`/work-logs/${id}`, data);
  return response.data;
};

// Delete a work log
export const deleteWorkLog = async (id) => {
  const response = await api.delete(`/work-logs/${id}`);
  return response.data;
};