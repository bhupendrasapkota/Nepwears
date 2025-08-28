import Review from "../models/Review.js";
import productService from "./productService.js";
import orderService from "./orderService.js";

//Helper
import { recomputeProductRating } from "../helpers/reviewHelpers.js";

const createReview = async (userId, productId, rating, comment) => {
  await productService.getProductById(productId);

  const hasDelivered = await orderService.hasUserDeliveredProduct(
    userId,
    productId
  );

  if (!hasDelivered) {
    const err = new Error(
      "You can only review products that you have purchased and received."
    );
    err.statusCode = 403;
    throw err;
  }

  const existing = await Review.findOne({ userId, productId }).select("_id");

  if (existing) {
    const err = new Error("You have already reviewed this product.");
    err.statusCode = 409;
    throw err;
  }

  const review = await Review.create({
    userId,
    productId,
    rating,
    comment: String(comment || ""),
  });

  const productRating = await recomputeProductRating(productId);

  return { review, productRating };
};

const getProductReviews = async (productId, options) => {
  await productService.getProductById(productId);

  const { page = 1, limit = 10, rating, sort = "newest" } = options;
  const skip = (page - 1) * limit;

  const query = { productId };
  if (rating && rating >= 1 && rating <= 5) {
    query.rating = rating;
  }

  const sortOptions = {};
  if (sort === "newest") {
    sortOptions.createdAt = -1;
  } else if (sort === "oldest") {
    sortOptions.createdAt = 1;
  } else if (sort === "highest") {
    sortOptions.rating = -1;
  } else if (sort === "lowest") {
    sortOptions.rating = 1;
  }

  const [reviews, totalCount] = await Promise.all([
    Review.find(query)
      .populate("userId", "firstName lastName")
      .populate("productId", "name brand")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    totalCount,
    currentPage: page,
  };
};

const getReviewById = async (reviewId) => {
  const review = await Review.findById(reviewId)
    .populate("userId", "firstName lastName")
    .populate("productId", "name brand");

  if (!review) {
    const err = new Error("Review not found.");
    err.statusCode = 404;
    throw err;
  }

  return review;
};

const updateReview = async (reviewId, productId, updates) => {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate("userId", "firstName lastName")
    .populate("productId", "name brand");

  if (!review) {
    const err = new Error("Review not found.");
    err.statusCode = 404;
    throw err;
  }

  const productRating = await recomputeProductRating(productId);

  return { review, productRating };
};

const deleteReview = async (reviewId, productId) => {
  const result = await Review.deleteOne({ _id: reviewId });

  if (result.deletedCount === 0) {
    const err = new Error("Review not found.");
    err.statusCode = 404;
    throw err;
  }

  const productRating = await recomputeProductRating(productId);

  return { deleted: true, productRating };
};

export default {
  createReview,
  getProductReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
