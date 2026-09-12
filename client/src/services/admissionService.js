import api from "./api";

// ========================================
// CREATE ADMISSION
// ========================================

export const createAdmission = async (
  admissionData
) => {
  const response = await api.post(
    "/admissions",
    admissionData
  );

  return response.data;
};

// ========================================
// GET ALL ADMISSIONS
// ========================================

export const getAdmissions = async () => {
  const response = await api.get(
    "/admissions"
  );

  return response.data;
};

// ========================================
// GET COMPANY ADMISSIONS
// ========================================

export const getCompanyAdmissions = async (
  companyId
) => {
  const response = await api.get(
    `/admissions/company/${companyId}`
  );

  return response.data;
};

// ========================================
// GET ADMISSION BY ID
// ========================================

export const getAdmissionById = async (
  admissionId
) => {
  const response = await api.get(
    `/admissions/${admissionId}`
  );

  return response.data;
};

// ========================================
// UPDATE ADMISSION
// ========================================

export const updateAdmission = async (
  admissionId,
  admissionData
) => {
  const response = await api.put(
    `/admissions/${admissionId}`,
    admissionData
  );

  return response.data;
};

// ========================================
// DELETE ADMISSION
// ========================================

export const deleteAdmission = async (
  admissionId
) => {
  const response = await api.delete(
    `/admissions/${admissionId}`
  );

  return response.data;
};