import api from "./api";

// Get approved reviews for a product
export const getProductReviews = async (productId) => {
  const response = await api.get("/reviews/public/", {
    params: { product_id: productId },
  });
  return response.data;
};

// Get logged-in customer's reviews
export const getMyReviews = async () => {
  const response = await api.get("/reviews/my-reviews/");
  return response.data;
};

// Submit a product review
export const createReview = async (reviewData) => {
  const response = await api.post("/reviews/my-reviews/", reviewData);
  return response.data;
};

// Update a review
export const updateReview = async (reviewId, reviewData) => {
  const response = await api.patch(
    `/reviews/my-reviews/${reviewId}/`,
    reviewData,
  );
  return response.data;
};

// Delete a review
export const deleteReview = async (reviewId) => {
  await api.delete(`/reviews/my-reviews/${reviewId}/`);
};
