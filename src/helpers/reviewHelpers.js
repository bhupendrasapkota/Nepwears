import Product from "../models/Product.js";
import Review from "../models/Review.js";

export const recomputeProductRating = async (productId) => {
  try {
    const reviews = await Review.find({ productId }).select("rating");

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        $set: {
          ratings: {
            average: 0,
            count: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
        },
      });
      return {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      distribution[review.rating]++;
    });

    const ratingData = {
      average: Math.round(averageRating * 100) / 100,
      count: reviews.length,
      distribution,
    };

    await Product.findByIdAndUpdate(productId, {
      $set: { ratings: ratingData },
    });

    return ratingData;
  } catch (error) {
    console.error("Error recomputing product rating:", error);
    throw error;
  }
};
