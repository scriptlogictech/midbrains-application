import api from "./api";

export const getTodayFollowUps = async () => {
  const response = await api.get("/followups/today");

  return response.data;
};

export const getMissedFollowUps = async () => {
  const response = await api.get("/followups/missed");

  return response.data;
};

export const getUpcomingFollowUps = async () => {
  const response = await api.get("/followups/upcoming");

  return response.data;
};