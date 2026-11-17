import api from "./api";

export const getProfile = async () => {
  const response = await api.get("/accounts/profile/");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.patch("/accounts/profile/", profileData);
  return response.data;
};
