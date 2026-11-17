
import api from './api'

// Get delivery assignments with search, filters and pagination
export const getDeliveryAssignments = async (params = {}) => {
  const response = await api.get('/delivery/assignments/', { params })
  return response.data
}

// Get active delivery staff
export const getDeliveryStaff = async (params = {}) => {
  const response = await api.get('/accounts/delivery-staff/', { params })
  return response.data
}

// Get shipped orders
export const getShippedOrders = async (params = {}) => {
  const response = await api.get('/orders/staff/', {
    params: { status: 'SHIPPED', ...params },
  })
  return response.data
}

// Create delivery assignment
export const createDeliveryAssignment = async (data) => {
  const response = await api.post('/delivery/assignments/', data)
  return response.data
}

// Get delivery details
export const getDeliveryDetails = async (deliveryId) => {
  const response = await api.get(`/delivery/assignments/${deliveryId}/`)
  return response.data
}

// Get assignment history
export const getDeliveryHistory = async (deliveryId) => {
  const response = await api.get(
    `/delivery/assignments/${deliveryId}/history/`
  )
  return response.data
}

// Reassign failed delivery
export const reassignDelivery = async (deliveryId, data) => {
  const response = await api.patch(
    `/delivery/assignments/${deliveryId}/reassign/`,
    data
  )
  return response.data
}

// Get deliveries assigned to logged-in delivery staff
export const getMyDeliveries = async (params = {}) => {
  const response = await api.get('/delivery/my-deliveries/', { params })
  return response.data
}

// Update delivery status
export const updateDeliveryStatus = async (deliveryId, data) => {
  const response = await api.patch(
    `/delivery/my-deliveries/${deliveryId}/status/`,
    data
  )
  return response.data
}
// Get current duty status
export const getDutyStatus = async () => {
  const response = await api.get("/delivery/duty/status/");
  return response.data;
};

// Start duty
export const startDuty = async () => {
  const response = await api.post("/delivery/duty/start/", {});
  return response.data;
};

// End duty
export const endDuty = async () => {
  const response = await api.post("/delivery/duty/end/", {});
  return response.data;
};
