import api from "./api";

// Get all delivery staff (active and inactive)
export const getDeliveryStaffMembers = async (params = {}) => {
  const response = await api.get(
    "/accounts/delivery-staff/management/",
    { params }
  );

  return response.data;
};

// Create a new delivery staff account
export const createDeliveryStaff = async (data) => {
  const response = await api.post(
    "/accounts/delivery-staff/management/",
    data
  );

  return response.data;
};

// Update delivery staff information, areas or active status
export const updateDeliveryStaff = async (staffId, data) => {
  const response = await api.patch(
    `/accounts/delivery-staff/management/${staffId}/`,
    data
  );

  return response.data;
};

// Get available delivery areas
export const getDeliveryAreas = async () => {
  const response = await api.get("/locations/areas/");
  return response.data;
};

// Get delivery staff duty monitoring information
export const getDutyMonitoring = async (params = {}) => {
  const response = await api.get(
    "/delivery/duty/monitoring/",
    { params }
  );

  return response.data;
};