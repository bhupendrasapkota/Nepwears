import express from "express";
import reviewController from "../controllers/reviewController.js";
import authMiddleware from "../middlewares/auth.js";
import { ROLE_ADMIN, ROLE_USER } from "../constants/roles.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  reviewController.createReview
);

router.get("/product/:productId", reviewController.getProductReviews);

router.get("/:id", reviewController.getReviewById);

router.patch(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN, ROLE_USER]),
  reviewController.updateReview
);

router.delete(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN, ROLE_USER]),
  reviewController.deleteReview
);

export default router;
