import api from './api'

export const registerCustomer = async (userData) => {
  const response = await api.post('/accounts/register/', userData)
  return response.data
}

export const loginCustomer = async (credentials) => {
  const response = await api.post('/token/', credentials)
  return response.data
}
