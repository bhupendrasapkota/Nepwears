import express from "express";
import productController from "../controllers/productController.js";
import authMiddleware from "../middlewares/auth.js";
import { ROLE_ADMIN } from "../constants/roles.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";

const router = express.Router();

// Create a product and initial variant at least one (Admin only)
router.post(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  productController.createProduct
);

router.get("/", productController.getAllProduct);

router.get("/:id", productController.getProductDetail);

router.patch(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  productController.updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  productController.deleteProduct
);

export default router;
