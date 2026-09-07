import api from "./api";

export const createProject = async (projectData) => {
  const response = await api.post("/projects", projectData);
  return response.data;
};

export const getProjects = async () => {
  const response = await api.get("/projects");
  return response.data;
};

export const getCompanyProjects = async (companyId) => {
  const response = await api.get(
    `/projects/company/${companyId}`
  );

  return response.data;
};

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