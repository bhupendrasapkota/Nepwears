import crypto from "crypto";

import Counter from "../models/Counter.js";

//Config
import config from "../config/config.js"; // default VAT

//Constant
import {
  ORDER_STATUS_CANCELLED,
  ORDER_STATUS_CONFIRMED,
  ORDER_STATUS_EXCHANGED,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_REFUNDED,
  ORDER_STATUS_RETURNED,
} from "../constants/orderStatus.js";

/* -------------------------------
   Shipping
-------------------------------- */
export const calculateShippingCost = (subtotal) => {
  return subtotal >= 2000 ? 0 : 200; // Free shipping above Rs. 2000
};

/* -------------------------------
   Status validation
-------------------------------- */
export const isValidStatusTransition = (
  currentStatus,
  newStatus,
  isAdmin = false
) => {
  if (isAdmin) return true; // Admins can make any transition
  const allowedTransitions = ORDER_STATUS_FLOW[currentStatus] || [];

  return allowedTransitions.includes(newStatus);
};

export const validateStatusChange = (order, newStatus) => {
  switch (newStatus) {
    case ORDER_STATUS_CANCELLED:
      if (!order.canBeCancelled()) {
        const error = new Error("Order cannot be cancelled at this stage");
        error.statusCode = 400;
        throw error;
      }
      break;
    case ORDER_STATUS_RETURNED:
      if (!order.canBeReturned()) {
        const error = new Error("Order cannot be returned at this stage");
        error.statusCode = 400;
        throw error;
      }
      break;
    case ORDER_STATUS_REFUNDED:
      if (order.paymentStatus !== "paid") {
        const error = new Error("Order must be paid before refund");
        error.statusCode = 400;
        throw error;
      }
      break;
    case ORDER_STATUS_EXCHANGED:
      if (!order.canBeExchanged?.()) {
        const error = new Error("Order cannot be exchanged at this stage");
        error.statusCode = 400;
        throw error;
      }
      break;
  }
};

/* -------------------------------
   Order number generator
-------------------------------- */
export const generateOrderNumbers = async (OrderModel, prefix = "ORD") => {
  const year = new Date().getFullYear();
  const seq = await Counter.getNext(`${prefix}-${year}`);
  const shortOrderId = `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
  const orderNumber = crypto.randomUUID();

  // Ensure shortOrderId uniqueness
  const existing = await OrderModel.findOne({ shortOrderId });
  if (existing) {
    return generateOrderNumbers(OrderModel, prefix); // retry
  }

  return { shortOrderId, orderNumber };
};

/* -------------------------------
   Order totals
-------------------------------- */
export const calculateOrderTotals = (items) => {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    subtotal += item.unitPrice * item.quantity;
    discountTotal += item.discountAmount || 0;
    taxTotal += item.taxAmount || 0;
  }

  // Shipping is calculated on the subtotal (sale price total)
  const shippingCost = calculateShippingCost(subtotal);
  const totalAmount = subtotal + taxTotal + shippingCost;

  return {
    subtotal,
    discountTotal,
    taxTotal,
    shippingCost,
    totalAmount,
  };
};

/* -------------------------------
   COD rules
-------------------------------- */
export const validateCODLimit = (totalAmount, codLimit = 5000) => {
  if (totalAmount > codLimit) {
    const error = new Error(
      `Cash on Delivery is not available for orders above Rs. ${codLimit}`
    );
    error.statusCode = 400;
    throw error;
  }
};

/* -------------------------------
   Stock & variant validation
-------------------------------- */
export const validateStockAvailability = (variant, quantity, productName) => {
  if (variant.stock < quantity) {
    const error = new Error(
      `Insufficient stock for ${productName} (${variant.sku}). Available: ${variant.stock}`
    );
    error.statusCode = 400;
    throw error;
  }
};

export const validateVariantStatus = (variant) => {
  if (variant.status !== "active") {
    const error = new Error(`Variant ${variant.sku} is not available`);
    error.statusCode = 400;
    throw error;
  }
};

/* -------------------------------
   Item pricing (with hybrid tax)
-------------------------------- */

export const calculateItemPricing = (
  variant,
  quantity,
  taxRate = config.taxRate
) => {
  const unitPrice = variant.salePrice || variant.price;
  const baseTotal = unitPrice * quantity;

  const discountAmount = variant.salePrice
    ? (variant.price - variant.salePrice) * quantity
    : 0;

  const taxableAmount = baseTotal;
  const taxAmount = taxRate > 0 ? taxableAmount * taxRate : 0;

  return {
    unitPrice,
    salePrice: variant.salePrice || null,
    totalPrice: baseTotal,
    discountAmount,
    taxAmount,
  };
};

export const createOrderItem = (product, variant, quantity, pricing) => {
  return {
    productId: product._id,
    variantId: variant._id,
    quantity,
    ...pricing,
    originalStock: variant.stock,
  };
};

/* -------------------------------
   Exchange
-------------------------------- */
export const validateExchangeItems = (exchangeItems, originalItems = []) => {
  if (!exchangeItems?.length) {
    const error = new Error("Exchange items are required");
    error.statusCode = 400;
    throw error;
  }

  for (const item of exchangeItems) {
    if (!item.originalItemId || !item.newProductId || !item.newVariantId) {
      const error = new Error("Invalid exchange item data");
      error.statusCode = 400;
      throw error;
    }
    if (!item.newQuantity || item.newQuantity <= 0) {
      const error = new Error("Exchange item must have a valid quantity");
      error.statusCode = 400;
      throw error;
    }

    // Ensure not exceeding original purchased quantity
    const originalItem = originalItems.find(
      (i) => i._id.toString() === item.originalItemId.toString()
    );
    if (originalItem && item.newQuantity > originalItem.quantity) {
      const error = new Error(
        `Cannot exchange more than purchased. Original qty: ${originalItem.quantity}`
      );
      error.statusCode = 400;
      throw error;
    }
  }
};

export const calculateExchangePricing = (originalItems, exchangeItems) => {
  let originalTotal = 0;
  let newTotal = 0;

  for (const exchangeItem of exchangeItems) {
    const originalItem = originalItems.find(
      (item) => item._id.toString() === exchangeItem.originalItemId.toString()
    );

    if (originalItem) {
      originalTotal += originalItem.totalPrice;
    }

    if (exchangeItem.totalPrice) {
      newTotal += exchangeItem.totalPrice;
    }
  }

  const priceDifference = newTotal - originalTotal;

  return { originalTotal, newTotal, priceDifference };
};

export const createExchangeOrderData = async (
  originalOrder,
  exchangeItems,
  adminNotes,
  OrderModel
) => {
  const { shortOrderId, orderNumber } = await generateOrderNumbers(
    OrderModel,
    "EXCH"
  );

  const { originalTotal, newTotal, priceDifference } = calculateExchangePricing(
    originalOrder.items,
    exchangeItems
  );

  const totals = calculateOrderTotals(exchangeItems);

  return {
    userId: originalOrder.userId,
    items: exchangeItems,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal || 0,
    shippingCost: totals.shippingCost,
    totalAmount: totals.totalAmount,
    shortOrderId,
    orderNumber,
    shippingAddress: originalOrder.shippingAddress,
    billingAddress: originalOrder.billingAddress,
    paymentMethod: "cod",
    paymentStatus: priceDifference > 0 ? "pending" : "paid",
    orderStatus: ORDER_STATUS_CONFIRMED,
    notes: {
      customer: `Exchange for order ${originalOrder.shortOrderId}`,
      internal: adminNotes || "",
    },
    businessRules: originalOrder.businessRules,
    metadata: {
      source: "exchange",
      userAgent: "admin",
      ipAddress: "admin",
      referrer: "exchange_approval",
      priceDifference,
      originalTotal,
      exchangeTotal: newTotal,
    },
  };
};

export const applyOrderPopulate = (query) => {
  return query
    .populate({
      path: "userId",
      select: "firstName lastName email phone",
    })
    .populate({
      path: "items.productId",
      select: "name brand imageUrls totalVariants",
    })
    .populate({
      path: "items.variantId",
      select: "sku size color price salePrice stock status",
    });
};
