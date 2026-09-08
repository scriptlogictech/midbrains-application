import api from "./api";

// ========================================
// SUPER ADMIN - CREATE WORK
// ========================================

export const createWorkTask = async (taskData) => {
  const response = await api.post("/work-tasks", taskData);
  return response.data;
};


// ========================================
// SUPER ADMIN - GET ALL WORK
// ========================================

export const getWorkTasks = async (params = {}) => {
  const response = await api.get("/work-tasks", {
    params,
  });

  return response.data;
};


// ========================================
// EMPLOYEE / INTERN - GET MY WORK
// ========================================

export const getMyWork = async () => {
  const response = await api.get("/work-tasks/my-work");
  return response.data;
};


// ========================================
// GET SINGLE WORK
// ========================================

export const getWorkTaskById = async (taskId) => {
  const response = await api.get(`/work-tasks/${taskId}`);
  return response.data;
};


// ========================================
// SUPER ADMIN - UPDATE WORK
// ========================================

export const updateWorkTask = async (taskId, taskData) => {
  const response = await api.put(
    `/work-tasks/${taskId}`,
    taskData
  );

  return response.data;
};


// ========================================
// EMPLOYEE / INTERN - UPDATE PROGRESS
// ========================================

export const updateWorkProgress = async (
  taskId,
  progressData
) => {
  const response = await api.put(
    `/work-tasks/${taskId}/progress`,
    progressData
  );

  return response.data;
};


// ========================================
// SUPER ADMIN - DELETE WORK
// ========================================

export const deleteWorkTask = async (taskId) => {
  const response = await api.delete(
    `/work-tasks/${taskId}`
  );

  return response.data;
};