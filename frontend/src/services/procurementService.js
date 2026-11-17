import api from "./api";

// Purchase Orders
export const getPurchaseOrders = async (params = {}) => {
  const response = await api.get("/procurement/", { params });
  return response.data;
};

export const getPurchaseOrderDetails = async (purchaseOrderId) => {
  const response = await api.get(`/procurement/${purchaseOrderId}/`);
  return response.data;
};

export const createPurchaseOrder = async (purchaseOrderData) => {
  const response = await api.post("/procurement/create/", purchaseOrderData);
  return response.data;
};

export const updatePurchaseOrder = async (
  purchaseOrderId,
  purchaseOrderData,
) => {
  const response = await api.patch(
    `/procurement/${purchaseOrderId}/`,
    purchaseOrderData,
  );
  return response.data;
};

export const confirmPurchaseOrder = async (purchaseOrderId) => {
  const response = await api.post(`/procurement/${purchaseOrderId}/confirm/`);
  return response.data;
};

export const receivePurchaseOrder = async (purchaseOrderId, receiptData) => {
  const response = await api.post(
    `/procurement/${purchaseOrderId}/receive/`,
    receiptData,
  );
  return response.data;
};

// Purchase Receipts
export const getPurchaseReceipts = async (params = {}) => {
  const response = await api.get("/procurement/receipts/", { params });
  return response.data;
};
