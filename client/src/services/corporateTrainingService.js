import api from "./api";

// ========================================
// CREATE CORPORATE TRAINING
// ========================================

export const createCorporateTraining = async (
  trainingData
) => {
  const response = await api.post(
    "/corporate-trainings",
    trainingData
  );

  return response.data;
};

// ========================================
// GET ALL CORPORATE TRAININGS
// ========================================

export const getCorporateTrainings = async () => {
  const response = await api.get(
    "/corporate-trainings"
  );

  return response.data;
};

// ========================================
// GET COMPANY CORPORATE TRAININGS
// ========================================

export const getCompanyCorporateTrainings =
  async (companyId) => {
    const response = await api.get(
      `/corporate-trainings/company/${companyId}`
    );

    return response.data;
  };

// ========================================
// UPDATE TRAINING STATUS
// ========================================

export const updateTrainingStatus = async (
  trainingId,
  trainingStatus
) => {
  const response = await api.put(
    `/corporate-trainings/${trainingId}/status`,
    {
      trainingStatus,
    }
  );

  return response.data;
};