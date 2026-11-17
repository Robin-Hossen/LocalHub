
import api from "./api";

// Public banners (optional placement filter)
export const getPublicBanners = async (params = {}) => {
  const response = await api.get("/banners/", { params });
  return response.data;
};

// Admin: Get all banners
export const getBanners = async (params = {}) => {
  const response = await api.get("/banners/staff/", { params });
  return response.data;
};

// Admin: Create banner
export const createBanner = async (formData) => {
  const response = await api.post("/banners/staff/", formData);
  return response.data;
};

// Admin: Update banner
export const updateBanner = async (id, formData) => {
  const response = await api.patch(`/banners/staff/${id}/`, formData);
  return response.data;
};

// Admin: Delete banner
export const deleteBanner = async (id) => {
  const response = await api.delete(`/banners/staff/${id}/`);
  return response.data;
};

export default {
  getPublicBanners,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
