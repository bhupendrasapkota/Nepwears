import express from "express";
import paymentController from "../controllers/paymentController.js";
import authMiddleware from "../middlewares/auth.js";
import { ROLE_USER, ROLE_ADMIN } from "../constants/roles.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";
import verifyWebhook from "../middlewares/verifyWebHook.js";

const router = express.Router();

router.post(
  "/khalti/initiate",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  paymentController.initiateKhaltiPayment
);

router.post(
  "/khalti/verify",
  verifyWebhook,
  paymentController.verifyKhaltiPayment
);

router.get("/khalti/verify", paymentController.verifyKhaltiPayment);

router.post(
  "/khalti/refund/:orderId",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  paymentController.refundKhaltiPayment
);

router.post(
  "/cod/confirm/:orderId",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  paymentController.confirmCODPayment
);

export default router;
