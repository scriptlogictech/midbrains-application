import api from "./api";

// ========================================
// CREATE ADMISSION
// ========================================

export const createAdmission = async (admissionData) => {
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
  const response = await api.get("/admissions");

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