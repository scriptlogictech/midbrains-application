import api from "./api";

export const getDashboardReport = async () => {
  const response = await api.get(
    "/reports/dashboard"
  );

  return response.data;
};

export const getLeadReport = async () => {
  const response = await api.get(
    "/reports/leads"
  );

  return response.data;
};

export const getRevenueReport = async () => {
  const response = await api.get(
    "/reports/revenue"
  );

  return response.data;
};

export const getPlacementReport = async () => {
  const response = await api.get(
    "/reports/placements"
  );

  return response.data;
};