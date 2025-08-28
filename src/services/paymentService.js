import Order from "../models/Order.js";
import khaltiService from "./khaltiService.js";
import { sendEmail } from "../utils/emails/email.js";
import {
  generateOrderConfirmationEmail,
  generateRefundEmail,
} from "../utils/emails/index.js";
import {
  ORDER_STATUS_CONFIRMED,
  ORDER_STATUS_REFUNDED,
} from "../constants/orderStatus.js";

// Initiate Khalti payment
const initiateKhaltiPayment = async (orderId, userId) => {
  const order = await Order.findById(orderId).populate(
    "userId",
    "firstName lastName email phone"
  );

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (order.userId._id.toString() !== userId) {
    const error = new Error("Unauthorized access to order.");
    error.statusCode = 403;
    throw error;
  }

  if (order.paymentStatus === "paid") {
    const error = new Error("Order is already paid.");
    error.statusCode = 400;
    throw error;
  }

  const customerInfo = {
    fullName: `${order.userId.firstName} ${order.userId.lastName}`,
    email: order.userId.email,
    phone: order.userId.phone,
  };

  const paymentData = {
    orderId: order._id.toString(),
    totalAmount: order.totalAmount,
    customerInfo,
  };

  let result;
  try {
    result = await khaltiService.initiatePayment(paymentData);
  } catch (e) {
    const error = new Error(e.message || "Khalti initiation failed");
    error.statusCode = e.status || 500;
    throw error;
  }

  // Update order with Khalti payment ID
  await Order.findByIdAndUpdate(orderId, {
    "paymentDetails.paymentGateway": "khalti",
    "paymentDetails.transactionId": result.pidx,
  });

  return result;
};

// Verify Khalti payment
const verifyKhaltiPayment = async (pidx) => {
  let verificationResult;
  try {
    verificationResult = await khaltiService.verifyPayment(pidx);
  } catch (e) {
    const error = new Error(e.message || "Khalti verification failed");
    error.statusCode = e.status || 500;
    throw error;
  }

  if (verificationResult.status !== "Completed") {
    const error = new Error("Payment verification failed.");
    error.statusCode = 400;
    throw error;
  }

  // Find order by pidx (paymentDetails.transactionId)
  const order = await Order.findOne({
    "paymentDetails.transactionId": pidx,
  })
    .populate("userId", "firstName lastName email phone")
    .populate("items.productId", "name brand imageUrls")
    .populate("items.variantId", "sku size color price salePrice");

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (order.paymentStatus === "paid") {
    const error = new Error("Order is already paid.");
    error.statusCode = 400;
    throw error;
  }

  // Update order payment status
  order.paymentStatus = "paid";
  order.orderStatus = ORDER_STATUS_CONFIRMED;
  order.amountPaid = order.totalAmount;
  order.confirmedAt = new Date();
  order.paymentDetails = {
    ...order.paymentDetails,
    transactionId: pidx,
    paymentDate: new Date(),
    gatewayResponse: verificationResult,
  };

  await order.save();

  // Send order confirmation email
  try {
    const { subject, html } = generateOrderConfirmationEmail(
      order,
      order.userId
    );
    await sendEmail(order.userId.email, { subject, body: html });
  } catch (emailError) {
    console.error("Failed to send payment confirmation email:", emailError);
  }

  return {
    orderId: order._id,
    transactionId: verificationResult.transaction_id,
    status: verificationResult.status,
    total_amount: verificationResult.total_amount,
  };
};

// Refund Khalti payment
const refundKhaltiPayment = async (orderId, adminId, amount, reason) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  // Authorization is enforced at the route layer (Admin only).
  // Do not block refunds here based on buyer ownership to allow admin-initiated refunds.

  if (order.paymentStatus !== "paid") {
    const error = new Error("Order is not paid.");
    error.statusCode = 400;
    throw error;
  }

  if (!order.paymentDetails?.transactionId) {
    const error = new Error("No Khalti transaction found for this order.");
    error.statusCode = 400;
    throw error;
  }

  // Amount validations
  if (amount <= 0) {
    const error = new Error("Refund amount must be greater than 0.");
    error.statusCode = 400;
    throw error;
  }

  const remainingRefundable = order.amountPaid - order.amountRefunded;
  if (amount > remainingRefundable) {
    const error = new Error(
      `Refund amount exceeds remaining refundable amount (Rs.${remainingRefundable}).`
    );
    error.statusCode = 400;
    throw error;
  }

  let refundResult;
  try {
    refundResult = await khaltiService.refundPayment(
      order.paymentDetails.transactionId,
      amount,
      reason
    );
  } catch (e) {
    const error = new Error(e.message || "Khalti refund failed");
    error.statusCode = e.status || 500;
    throw error;
  }

  // Update refund tracking with admin information
  order.amountRefunded += amount;
  const fullyRefunded = order.amountRefunded >= order.amountPaid;
  if (fullyRefunded) {
    order.orderStatus = ORDER_STATUS_REFUNDED;
    order.paymentStatus = "refunded";
  } else {
    order.paymentStatus = "partially_refunded";
  }

  // Track who processed the refund for audit purposes
  order.cancellation = {
    ...order.cancellation,
    refundAmount: (order.cancellation?.refundAmount || 0) + amount,
    refundMethod: "khalti",
    refundDate: new Date(),
    refundProcessedBy: adminId,
    refundReason: reason,
  };

  await order.save();

  // Populate for email context
  await order.populate("userId", "firstName lastName email phone");
  try {
    const { subject, html } = generateRefundEmail(order, order.userId, amount);
    await sendEmail(order.userId.email, { subject, body: html });
  } catch (emailError) {
    console.error("Failed to send refund confirmation email:", emailError);
  }

  return {
    refundId: refundResult.refundId,
    status: refundResult.status,
    amount: refundResult.amount,
    reason: refundResult.reason,
    totalRefunded: order.amountRefunded,
    paymentStatus: order.paymentStatus,
    processedBy: adminId,
  };
};

// Confirm COD payment
const confirmCODPayment = async (orderId, adminId, paymentData) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }

    if (order.paymentMethod !== "cod") {
      const error = new Error("Order is not a COD order");
      error.statusCode = 400;
      throw error;
    }

    if (order.paymentStatus === "paid") {
      const error = new Error("Order is already paid");
      error.statusCode = 400;
      throw error;
    }

    // Update order with COD payment details
    order.paymentStatus = "paid";
    order.amountPaid = paymentData.amountReceived;
    order.orderStatus = ORDER_STATUS_CONFIRMED;
    order.confirmedAt = new Date();
    order.codDetails = {
      amountReceived: paymentData.amountReceived,
      deliveryAgentId: adminId,
      paymentDate: new Date(),
      deliveryNotes: paymentData.deliveryNotes || "",
      agentSignature: paymentData.agentSignature,
      customerSignature: paymentData.customerSignature,
    };

    await order.save({ session });
    await session.commitTransaction();

    // Send confirmation email
    try {
      const { subject, html } = generateOrderConfirmationEmail(
        order,
        order.userId
      );
      await sendEmail(order.userId.email, { subject, body: html });
    } catch (emailError) {
      console.error("Failed to send COD confirmation email:", emailError);
    }

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export default {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  refundKhaltiPayment,
  confirmCODPayment,
};
