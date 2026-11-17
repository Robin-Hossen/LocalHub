import api from "./api";

export const getAddresses = async () => {
  const response = await api.get("/locations/addresses/");
  return response.data;
};

export const addAddress = async (addressData) => {
  const response = await api.post("/locations/addresses/", addressData);
  return response.data;
};

export const updateAddress = async (addressId, addressData) => {
  const response = await api.patch(
    `/locations/addresses/${addressId}/`,
    addressData,
  );
  return response.data;
};

export const deleteAddress = async (addressId) => {
  const response = await api.delete(`/locations/addresses/${addressId}/`);
  return response.data;
};
export const getAreas = async () => {
  const response = await api.get("/locations/areas/");
  return response.data;
};