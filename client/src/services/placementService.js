import api from "./api";

export const createPlacement = async (placementData) => {
  const response = await api.post(
    "/placements",
    placementData
  );

  return response.data;
};

export const getPlacements = async () => {
  const response = await api.get("/placements");

  return response.data;
};

export const getCompanyPlacements = async (companyId) => {
  const response = await api.get(
    `/placements/company/${companyId}`
  );

  return response.data;
};

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