import express from "express";
import cartController from "../controllers/cartController.js";
import authMiddleware from "../middlewares/auth.js";
import { ROLE_USER } from "../constants/roles.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  cartController.createCart
);

router.get(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  cartController.getCart
);

router.patch(
  "/item/:id",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  cartController.updateCartItem
);

router.delete(
  "/item/:id",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  cartController.deleteCartItem
);

router.delete(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  cartController.deleteCart
);

export default router;
