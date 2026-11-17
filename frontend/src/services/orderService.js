import api from "./api";

export const getOrders = async () => {
  const response = await api.get("/orders/");
  return response.data;
};

export const getOrderDetails = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/`);
  return response.data;
};
export const getStaffOrders = async () => {
  const response = await api.get("/orders/staff/");
  return response.data;
};
export const updateStaffOrderStatus = async (orderId, status) => {
  const response = await api.patch(`/orders/staff/${orderId}/status/`, {
    status,
  });

  return response.data;
};
export const getStaffOrderDetails = async (orderId) => {
  const response = await api.get(`/orders/staff/${orderId}/`);
  return response.data;
};