import reviewService from "../services/reviewService.js";

// Formatter
import {
  formatReviewResponse,
  formatProductRatingResponse,
} from "../helpers/dataFormatter.js";

// Utils
import canAccessUser from "../utils/access.js";

const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    const r = Number(rating);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    if (!String(comment || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required.",
      });
    }

    const review = await reviewService.createReview(
      userId,
      productId,
      r,
      comment
    );

    return res.status(201).json({
      success: true,
      message: "Review created successfully.",
      review: formatReviewResponse(review.review),
      productRating: formatProductRatingResponse(review.productRating),
    });
  } catch (error) {
    console.error("Error creating review:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sort = "newest" } = req.query;

    const { reviews, totalCount, currentPage } =
      await reviewService.getProductReviews(productId, {
        page: parseInt(page),
        limit: parseInt(limit),
        rating: rating ? parseInt(rating) : null,
        sort,
      });

    const formattedReviews = reviews.map(formatReviewResponse);

    return res.status(200).json({
      success: true,
      message: "Product reviews fetched successfully.",
      reviews: formattedReviews,
      totalCount,
      currentPage,
      filters: { rating, sort },
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await reviewService.getReviewById(id);

    return res.status(200).json({
      success: true,
      message: "Review fetched successfully.",
      review: formatReviewResponse(review),
    });
  } catch (error) {
    console.error("Error fetching review:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUser = req.user;

    const existing = await reviewService.getReviewById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (!canAccessUser(loggedInUser, existing.userId._id)) {
      return res.status(403).json({
        success: false,
        message: `Sorry ${loggedInUser.firstName}, you don't have access.`,
      });
    }

    const updates = {};

    if (req.body.rating != null) {
      const r = Number(req.body.rating);

      if (Number.isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5.",
        });
      }

      updates.rating = r;
    }

    if (req.body.comment != null) {
      const c = String(req.body.comment).trim();

      if (!c) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot be empty.",
        });
      }

      updates.comment = c;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid updates provided.",
      });
    }

    const review = await reviewService.updateReview(
      id,
      existing.productId,
      updates
    );

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review: formatReviewResponse(review.review),
      productRating: formatProductRatingResponse(review.productRating),
    });
  } catch (error) {
    console.error("Error updating review:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const loggedInUser = req.user;

    const existing = await reviewService.getReviewById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (!canAccessUser(loggedInUser, existing.userId._id)) {
      return res.status(403).json({
        success: false,
        message: `Sorry ${loggedInUser.firstName}, you don't have access.`,
      });
    }

    const { deleted, productRating } = await reviewService.deleteReview(
      id,
      existing.productId
    );

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
      deleted,
      productRating: formatProductRatingResponse(productRating),
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export default {
  createReview,
  getProductReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
