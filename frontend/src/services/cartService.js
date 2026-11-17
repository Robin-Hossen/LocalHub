import api from "./api";

export const getCart = async () => {
  const response = await api.get("/cart/");
  return response.data;
};

export const addCartItem = async (productId, quantity = 1) => {
  const response = await api.post("/cart/add/", {
    product_id: productId,
    quantity,
  });
  return response.data;
};

export const updateCartItem = async (itemId, quantity) => {
  const response = await api.patch(`/cart/items/${itemId}/`, {
    quantity,
  });
  return response.data;
};

export const removeCartItem = async (itemId) => {
  await api.delete(`/cart/items/${itemId}/`);
};

export const clearCartAPI = async () => {
  const response = await api.delete("/cart/clear/");
  return response.data;
};


export const checkoutCart = async (checkoutData) => {
  const response = await api.post("/cart/checkout/", checkoutData);
  return response.data;
};
