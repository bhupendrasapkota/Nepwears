import express from "express";
import variantController from "../controllers/variantController.js";
import authMiddleware from "../middlewares/auth.js";
import { ROLE_ADMIN } from "../constants/roles.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";

const router = express.Router();

// Create a variant for a product single at a time (Admin only)
router.post(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  variantController.createVariant
);

// Get all variants of a product by product ID
router.get(
  "/product/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  variantController.getVariantsByProductId
);

// Get a specific variant by ID (Admin only)
router.get(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  variantController.getVariantById
);

// Update a variant by ID (Admin only)
router.patch(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  variantController.updateVariant
);

// Delete a variant by ID (Admin only)
router.delete(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  variantController.deleteVariant
);

// Delete a variant image by ID (Admin only)
router.delete(
  "/:id/image",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  variantController.deleteVariantImage
);

export default router;
