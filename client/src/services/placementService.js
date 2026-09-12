import api from "./api";

// ==========================================
// CREATE PLACEMENT
// ==========================================

export const createPlacement = async (
  placementData
) => {
  const response = await api.post(
    "/placements",
    placementData
  );

  return response.data;
};

// ==========================================
// GET ALL PLACEMENTS
// ==========================================

export const getPlacements = async () => {
  const response = await api.get(
    "/placements"
  );

  return response.data;
};

// ==========================================
// GET COMPANY PLACEMENTS
// ==========================================

export const getCompanyPlacements = async (
  companyId
) => {
  const response = await api.get(
    `/placements/company/${companyId}`
  );

  return response.data;
};

// ==========================================
// GET PLACEMENT BY ID
// ==========================================

export const getPlacementById = async (
  placementId
) => {
  const response = await api.get(
    `/placements/${placementId}`
  );

  return response.data;
};

// ==========================================
// UPDATE PLACEMENT
// ==========================================

export const updatePlacement = async (
  placementId,
  placementData
) => {
  const response = await api.put(
    `/placements/${placementId}`,
    placementData
  );

  return response.data;
};

// ==========================================
// UPDATE PLACEMENT STATUS
// ==========================================

export const updatePlacementStatus = async (
  placementId,
  statusData
) => {
  const response = await api.put(
    `/placements/${placementId}/status`,
    statusData
  );

  return response.data;
};

// ==========================================
// DELETE PLACEMENT
// ==========================================

export const deletePlacement = async (
  placementId
) => {
  const response = await api.delete(
    `/placements/${placementId}`
  );

  return response.data;
};