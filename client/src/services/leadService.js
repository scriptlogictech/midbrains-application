import api from "./api";

export const getLeads = async (companyId, params = {}) => {
  const response = await api.get(`/leads/${companyId}`, {
    params,
  });

  return response.data;
};

export const createLead = async (leadData) => {
  const response = await api.post("/leads", leadData);

  return response.data;
};

export const updateLead = async (leadId, leadData) => {
  const response = await api.put(
    `/leads/${leadId}`,
    leadData
  );

  return response.data;
};

export const updateLeadStatus = async (
  leadId,
  status
) => {
  const response = await api.put(
    `/leads/${leadId}/status`,
    {
      status,
    }
  );

  return response.data;
};

export const addCommunication = async (
  leadId,
  communicationData
) => {
  const response = await api.post(
    `/leads/${leadId}/communication`,
    communicationData
  );

  return response.data;
};