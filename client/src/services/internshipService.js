import api from "./api";

// ========================================
// CREATE INTERNSHIP
// ========================================

export const createInternship = async (
  internshipData
) => {
  const response = await api.post(
    "/internships",
    internshipData
  );

  return response.data;
};

// ========================================
// GET ALL INTERNSHIPS
// ========================================

export const getInternships = async () => {
  const response = await api.get(
    "/internships"
  );

  return response.data;
};

// ========================================
// GET COMPANY INTERNSHIPS
// ========================================

export const getCompanyInternships = async (
  companyId
) => {
  const response = await api.get(
    `/internships/company/${companyId}`
  );

  return response.data;
};

// ========================================
// GET INTERNSHIP BY ID
// ========================================

export const getInternshipById = async (
  internshipId
) => {
  const response = await api.get(
    `/internships/${internshipId}`
  );

  return response.data;
};

// ========================================
// UPDATE INTERNSHIP
// ========================================

export const updateInternship = async (
  internshipId,
  internshipData
) => {
  const response = await api.put(
    `/internships/${internshipId}`,
    internshipData
  );

  return response.data;
};

// ========================================
// UPDATE INTERNSHIP STATUS
// ========================================

export const updateInternshipStatus = async (
  internshipId,
  status
) => {
  const response = await api.put(
    `/internships/${internshipId}/status`,
    {
      status,
    }
  );

  return response.data;
};

// ========================================
// DELETE INTERNSHIP
// ========================================

export const deleteInternship = async (
  internshipId
) => {
  const response = await api.delete(
    `/internships/${internshipId}`
  );

  return response.data;
};