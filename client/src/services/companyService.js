import api from "./api";

export const getCompanies = async () => {
  const response = await api.get("/companies");

  return response.data;
};