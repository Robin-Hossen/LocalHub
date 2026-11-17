import api from "./api";

export const getVendors = async (params = {}) => {
  const response = await api.get("/vendors/", { params });
  return response.data;
};
export const createVendor = async (vendorData) => {
  const response = await api.post("/vendors/", vendorData);
  return response.data;
};

export const updateVendor = async (vendorId, vendorData) => {
  const response = await api.patch(`/vendors/${vendorId}/`, vendorData);
  return response.data;
};

export const getVendorTypes = async () => {
  const response = await api.get("/vendors/types/");
  return response.data;
};
export const getVendorAreas = async () => {
  const response = await api.get("/locations/areas/");
  return response.data;
};
export const deleteVendor = async (vendorId) => {
  const response = await api.delete(`/vendors/${vendorId}/`);
  return response.data;
};