import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Minus, Plus, ArrowLeft, Star } from "lucide-react";

import { getProductDetails } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { getOrders } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";

import {
  getProductReviews,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../../services/reviewService";

function ProductDetailsPage() {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductDetails(productId);
        setProduct(data);
      } catch (err) {
        console.error("Product fetch error:", err);
        setError("Unable to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Fetch public reviews
  const fetchReviews = async () => {
    try {
      setReviewLoading(true);
      const data = await getProductReviews(productId);
      setReviews(data.results ?? data);
    } catch (err) {
      console.error("Review fetch error:", err);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Fetch customer's eligible orders and reviews
  useEffect(() => {
    const fetchReviewEligibility = async () => {
      if (!isAuthenticated) {
        setEligibleOrders([]);
        setMyReviews([]);
        return;
      }

      try {
        const [ordersData, reviewsData] = await Promise.all([
          getOrders(),
          getMyReviews(),
        ]);

        const orders = ordersData.results ?? ordersData;
        const customerReviews = reviewsData.results ?? reviewsData;

        const eligible = orders.filter(
          (order) =>
            order.status === "DELIVERED" &&
            order.items?.some(
              (item) => Number(item.product) === Number(productId),
            ),
        );

        setEligibleOrders(eligible);
        setMyReviews(customerReviews);
      } catch (err) {
        console.error("Review eligibility error:", err);
      }
    };

    fetchReviewEligibility();
  }, [productId, isAuthenticated]);

  // Add to cart
  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity);
    } catch (err) {
      console.error("Add to cart error:", err);
    }
  };

  // Submit review
  const handleSubmitReview = async (orderId) => {
    try {
      setReviewSubmitting(true);
      setReviewMessage("");

      await createReview({
        order_id: orderId,
        product_id: Number(productId),
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviewMessage("Your review has been submitted successfully.");
      setReviewComment("");
      setReviewRating(5);

      const [reviewsData, myReviewsData] = await Promise.all([
        getProductReviews(productId),
        getMyReviews(),
      ]);

      setReviews(reviewsData.results ?? reviewsData);
      setMyReviews(myReviewsData.results ?? myReviewsData);
    } catch (err) {
      console.error("Review submission error:", err);

      const errorData = err.response?.data;
      setReviewMessage(
        typeof errorData === "string"
          ? errorData
          : "Unable to submit your review. Please try again.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Edit review
  const handleEditReview = async (reviewId) => {
    try {
      setReviewSubmitting(true);
      setReviewMessage("");

      await updateReview(reviewId, {
        rating: editRating,
        comment: editComment,
      });

      setEditingReviewId(null);
      setReviewMessage("Your review has been updated successfully.");

      const [reviewsData, myReviewsData] = await Promise.all([
        getProductReviews(productId),
        getMyReviews(),
      ]);

      setReviews(reviewsData.results ?? reviewsData);
      setMyReviews(myReviewsData.results ?? myReviewsData);
    } catch (err) {
      console.error("Review update error:", err);
      setReviewMessage("Unable to update your review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?",
    );

    if (!confirmed) return;

    try {
      setReviewSubmitting(true);
      setReviewMessage("");

      await deleteReview(reviewId);

      setEditingReviewId(null);
      setReviewMessage("Your review has been deleted successfully.");

      const [reviewsData, myReviewsData] = await Promise.all([
        getProductReviews(productId),
        getMyReviews(),
      ]);

      setReviews(reviewsData.results ?? reviewsData);
      setMyReviews(myReviewsData.results ?? myReviewsData);
    } catch (err) {
      console.error("Review delete error:", err);
      setReviewMessage("Unable to delete your review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || "Product not found."}</p>
        <Link to="/" className="text-green-700 font-semibold">
          Back to Home
        </Link>
      </div>
    );
  }

  const imageUrl =
    product.image ||
    product.image_url ||
    "https://placehold.co/600x600?text=Product";

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-700 mb-8"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        {/* Product details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-gray-50 rounded-xl flex items-center justify-center p-6">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full max-h-[420px] object-contain"
              />
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-sm text-green-700 font-semibold mb-3">
                {product.category_name || "LocalHub Product"}
              </p>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <p className="text-gray-600 leading-7 mb-6">
                {product.description || "No description available."}
              </p>

              <div className="mb-6">
                <span className="text-3xl font-bold text-green-700">
                  ৳{Number(product.selling_price || 0).toFixed(2)}
                </span>
              </div>

              <p
                className={`text-sm font-medium mb-6 ${
                  product.stock_quantity > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
              </p>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-medium text-gray-700">Quantity:</span>

                <div className="flex items-center border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Minus size={18} />
                  </button>

                  <span className="px-5 font-semibold">{quantity}</span>

                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Customer Reviews
          </h2>

          {reviewMessage && (
            <p className="mb-5 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              {reviewMessage}
            </p>
          )}

          {reviewLoading ? (
            <p className="text-gray-500">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500">No reviews for this product yet.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-100 pb-6 last:border-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.customer_email || "Customer"}
                      </p>

                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={17}
                            fill={
                              star <= review.rating ? "currentColor" : "none"
                            }
                            className="text-yellow-500"
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-gray-400">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : ""}
                    </p>
                  </div>

                  {review.comment && (
                    <p className="text-gray-600 mt-3">{review.comment}</p>
                  )}

                  {/* Edit and Delete buttons */}
                  {isAuthenticated &&
                    myReviews.some((myReview) => myReview.id === review.id) && (
                      <div className="mt-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setEditingReviewId(review.id);
                              setEditRating(review.rating);
                              setEditComment(review.comment || "");
                              setReviewMessage("");
                            }}
                            className="text-sm text-green-700 font-semibold hover:underline"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={reviewSubmitting}
                            className="text-sm text-red-600 font-semibold hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>

                        {/* Edit form */}
                        {editingReviewId === review.id && (
                          <div className="mt-5 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Update Rating
                              </label>

                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setEditRating(star)}
                                    className="text-yellow-500"
                                  >
                                    <Star
                                      size={24}
                                      fill={
                                        star <= editRating
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <textarea
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              rows="3"
                              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Update your comment..."
                            />

                            <div className="flex gap-3">
                              <button
                                onClick={() => handleEditReview(review.id)}
                                disabled={reviewSubmitting}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                {reviewSubmitting
                                  ? "Saving..."
                                  : "Save Changes"}
                              </button>

                              <button
                                onClick={() => setEditingReviewId(null)}
                                disabled={reviewSubmitting}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write a Review */}
        {isAuthenticated && eligibleOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Write a Review
            </h2>

            {eligibleOrders.map((order) => {
              const alreadyReviewed = myReviews.some(
                (review) =>
                  Number(review.order) === Number(order.id) &&
                  Number(review.product) === Number(productId),
              );

              if (alreadyReviewed) return null;

              return (
                <div key={order.id} className="border rounded-xl p-5 mb-4">
                  <p className="font-medium text-gray-700 mb-4">
                    Order #{order.order_number || order.id}
                  </p>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Rating
                  </label>

                  <div className="flex gap-2 mb-5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-yellow-500"
                      >
                        <Star
                          size={28}
                          fill={star <= reviewRating ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Comment
                  </label>

                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows="4"
                    className="w-full border rounded-lg p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Share your experience with this product..."
                  />

                  <button
                    onClick={() => handleSubmitReview(order.id)}
                    disabled={reviewSubmitting}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-8 text-center">
            <p className="text-gray-600">
              Please{" "}
              <Link
                to="/login"
                className="text-green-700 font-semibold hover:underline"
              >
                login
              </Link>{" "}
              to write a review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailsPage;
