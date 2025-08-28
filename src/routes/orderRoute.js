import express from "express";
import orderController from "../controllers/orderController.js";
import authMiddleware from "../middlewares/auth.js";
import { ROLE_USER, ROLE_ADMIN } from "../constants/roles.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";

const router = express.Router();

// ========== USER ORDER ROUTES ==========

// Create order from cart
router.post(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  orderController.createOrder
);

// Get user's orders with filtering and pagination
router.get(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  orderController.getUserOrders
);

// Get specific order by ID
router.get(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  orderController.getOrderById
);

// Update order status (cancel, return, refund)
router.patch(
  "/:id/status",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  orderController.updateOrderStatus
);

// Request exchange
router.post(
  "/:id/exchange",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  orderController.requestExchange
);

// ========== ADMIN ORDER ROUTES ==========

// Get all orders with advanced filtering
router.get(
  "/admin/all",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  orderController.getAllOrders
);

// Get order statistics
router.get(
  "/admin/stats",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  orderController.getOrderStats
);

// Get order status flow
router.get(
  "/admin/status-flow",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  orderController.getOrderStatusFlow
);

// Get specific order (Admin can view any order)
router.get(
  "/admin/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  orderController.getOrderByIdAdmin
);

// Update order status (Admin can update any order)
router.patch(
  "/admin/:id/status",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  orderController.updateOrderStatusAdmin
);

// ========== ADMIN EXCHANGE ROUTES ==========

// Approve exchange
router.post(
  "/admin/:id/exchange/approve",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  orderController.approveExchange
);

// Reject exchange
router.post(
  "/admin/:id/exchange/reject",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  orderController.rejectExchange
);

// Complete exchange
router.post(
  "/admin/:id/exchange/complete",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  orderController.completeExchange
);

export default router;
