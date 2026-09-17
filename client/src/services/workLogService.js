import api from "./api";

export const createWorkLog = async (data) => {
  const response = await api.post("/work-logs", data);
  return response.data;
};

export const getMyWorkLogs = async () => {
  const response = await api.get("/work-logs/my-logs");
  return response.data;
};

// Update work log
export const updateWorkLog = async (id, data) => {
  const response = await api.put(`/work-logs/${id}`, data);
  return response.data;
};

// Delete work log
export const deleteWorkLog = async (id) => {
  const response = await api.delete(`/work-logs/${id}`);
  return response.data;
};