import api from "./api";

export const createWorkTask = async (taskData) => {
    const response = await api.post(
        "/work-tasks",
        taskData
    );

    return response.data;
};


export const createSelfWork = async (workData) => {
    const response = await api.post(
        "/work-tasks/self",
        workData
    );

    return response.data;
};


export const getWorkTasks = async (params = {}) => {
    const response = await api.get(
        "/work-tasks",
        {
            params,
        }
    );

    return response.data;
};


export const getMyWork = async () => {
    const response = await api.get(
        "/work-tasks/my-work"
    );

    return response.data;
};


export const getWorkTaskById = async (
    taskId
) => {
    const response = await api.get(
        `/work-tasks/${taskId}`
    );

    return response.data;
};


export const updateWorkTask = async (
    taskId,
    taskData
) => {
    const response = await api.put(
        `/work-tasks/${taskId}`,
        taskData
    );

    return response.data;
};


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


export const deleteWorkTask = async (
    taskId
) => {
    const response = await api.delete(
        `/work-tasks/${taskId}`
    );

    return response.data;
};