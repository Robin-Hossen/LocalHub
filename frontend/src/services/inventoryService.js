import api from "./api";

// Get stock list
export const getStockList = async (params = {}) => {
  const response = await api.get("/inventory/stock/", { params });
  return response.data;
};

// Get stock details
export const getStockDetails = async (stockId) => {
  const response = await api.get(`/inventory/stock/${stockId}/`);
  return response.data;
};

// Get stock movements
export const getStockMovements = async (params = {}) => {
  const response = await api.get("/inventory/movements/", { params });
  return response.data;
};

// Add stock
export const addStock = async (stockData) => {
  const response = await api.post("/inventory/stock/add/", stockData);
  return response.data;
};

// Remove stock
export const removeStock = async (stockData) => {
  const response = await api.post("/inventory/stock/remove/", stockData);
  return response.data;
};

// Update stock reorder level
export const updateStock = async (stockId, stockData) => {
  const response = await api.patch(`/inventory/stock/${stockId}/`, stockData);
  return response.data;
};
