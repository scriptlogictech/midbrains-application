import api from "./api";

// Create Project
export const createProject = async (projectData) => {
  const response = await api.post("/projects", projectData);
  return response.data;
};

// Get All Projects
export const getProjects = async () => {
  const response = await api.get("/projects");
  return response.data;
};

// Get Projects By Company
export const getCompanyProjects = async (companyId) => {
  const response = await api.get(
    `/projects/company/${companyId}`
  );

  return response.data;
};

// Get Project By ID
export const getProjectById = async (projectId) => {
  const response = await api.get(
    `/projects/${projectId}`
  );

  return response.data;
};

// Update Project
export const updateProject = async (projectId, projectData) => {
  const response = await api.put(
    `/projects/${projectId}`,
    projectData
  );

  return response.data;
};

// Update Project Status
export const updateProjectStatus = async (
  projectId,
  projectStatus
) => {
  const response = await api.put(
    `/projects/${projectId}/status`,
    { projectStatus }
  );

  return response.data;
};

// Delete Project
export const deleteProject = async (projectId) => {
  const response = await api.delete(
    `/projects/${projectId}`
  );

  return response.data;
};