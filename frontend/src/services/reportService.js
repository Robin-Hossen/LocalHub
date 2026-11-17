
import api from './api'

// Sales summary
export const getSalesSummary = async (params = {}) => {
  const response = await api.get('/reports/sales/summary/', { params })
  return response.data
}

// Daily sales report
export const getDailySalesReport = async (params = {}) => {
  const response = await api.get('/reports/sales/daily/', { params })
  return response.data
}

// Monthly sales report
export const getMonthlySalesReport = async (params = {}) => {
  const response = await api.get('/reports/sales/monthly/', { params })
  return response.data
}

// Product sales report
export const getProductSalesReport = async (params = {}) => {
  const response = await api.get('/reports/sales/products/', { params })
  return response.data
}

// Vendor purchase report
export const getVendorPurchaseReport = async (params = {}) => {
  const response = await api.get('/reports/purchases/vendors/', { params })
  return response.data
}

// Inventory report
export const getInventoryReport = async () => {
  const response = await api.get('/reports/inventory/')
  return response.data
}

// Delivery performance report
export const getDeliveryPerformanceReport = async (params = {}) => {
  const response = await api.get('/reports/delivery/performance/', { params })
  return response.data
}
