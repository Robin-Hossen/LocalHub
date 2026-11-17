import api from "./api";

export const getProducts = async (params = {}) => {
  const response = await api.get("/catalog/products/", {
    params,
  });

  return response.data;
};

export const getCategories = async () => {
  const response = await api.get("/catalog/categories/");
  return response.data;
};
export const getProductDetails = async (productId) => {
  const response = await api.get(`/catalog/products/${productId}/`);
  return response.data;
};
export const getStaffProducts = async (params = {}) => {
  const response = await api.get("/catalog/staff/products/", {
    params,
  });
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post("/catalog/staff/products/", productData);
  return response.data;
};
export const updateProduct = async (productId, productData) => {
  const response = await api.patch(
    `/catalog/staff/products/${productId}/`,
    productData,
  );
  return response.data;
};
export const getStaffCategories = async () => {
  const response = await api.get("/catalog/staff/categories/");
  return response.data;
};
export const createCategory = async (categoryData) => {
  const response = await api.post("/catalog/staff/categories/", categoryData);
  return response.data;
};

export const updateCategory = async (categoryId, categoryData) => {
  const response = await api.patch(
    `/catalog/staff/categories/${categoryId}/`,
    categoryData,
  );
  return response.data;
};

export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/catalog/staff/categories/${categoryId}/`);
  return response.data;
};