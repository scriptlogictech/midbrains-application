
import api from "./api";

// Get Leads
export const getLeads = async (companyId, params = {}) => {
    const response = await api.get("/leads", {
        params: {
            ...params,
            companyId,
        },
    });

    return response.data;
};

// Create Lead
export const createLead = async (leadData) => {
    const response = await api.post("/leads", leadData);
    return response.data;
};

// Update Lead
export const updateLead = async (leadId, leadData) => {
    const response = await api.put(`/leads/${leadId}`, leadData);
    return response.data;
};

// Update Lead Status
export const updateLeadStatus = async (leadId, status) => {
    const response = await api.put(
        `/leads/${leadId}/status`,
        { status }
    );

    return response.data;
};

// Add Communication
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

// Update Communication
export const updateCommunication = async (
    leadId,
    communicationId,
    communicationData
) => {
    const response = await api.put(
        `/leads/${leadId}/communication/${communicationId}`,
        communicationData
    );

    return response.data;
};

// Delete Communication
export const deleteCommunication = async (
    leadId,
    communicationId
) => {
    const response = await api.delete(
        `/leads/${leadId}/communication/${communicationId}`
    );

    return response.data;
};



// Delete Lead
export const deleteLead = async (leadId) => {
    const response = await api.delete(`/leads/${leadId}`);
    return response.data;
};