import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Variant from "../models/Variant.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/emails/email.js";
import {
  generateOrderConfirmationEmail,
  generateOrderStatusEmail,
} from "../utils/emails/index.js";
import {
  ORDER_STATUS_CANCELLED,
  ORDER_STATUS_CONFIRMED,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_PENDING,
  ORDER_STATUS_PROCESSING,
  ORDER_STATUS_RETURNED,
  ORDER_STATUS_SHIPPED,
  ORDER_STATUS_EXCHANGE_REQUESTED,
  ORDER_STATUS_EXCHANGE_APPROVED,
  ORDER_STATUS_EXCHANGED,
} from "../constants/orderStatus.js";

import {
  applyOrderPopulate,
  calculateItemPricing,
  calculateOrderTotals,
  createOrderItem,
  generateOrderNumbers,
  isValidStatusTransition,
  validateCODLimit,
  validateStatusChange,
  validateStockAvailability,
  validateVariantStatus,
  validateExchangeItems,
  calculateExchangePricing,
  calculateShippingCost,
} from "../helpers/orderHelpers.js";

const createOrder = async (userId, orderData) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      useShippingAsBilling = true,
      businessRules = {},
      shippingMethod = "standard",
    } = orderData;

    const user = await User.findById(userId).session(session);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (!shippingAddress) {
      const error = new Error("Shipping address is required");
      error.statusCode = 400;
      throw error;
    }

    const finalBillingAddress = useShippingAsBilling
      ? shippingAddress
      : billingAddress;
    if (!finalBillingAddress) {
      const error = new Error("Billing address is required");
      error.statusCode = 400;
      throw error;
    }

    const cart = await Cart.findOne({ userId })
      .populate({ path: "items.productId", select: "name brand imageUrls" })
      .populate({
        path: "items.variantId",
        select: "sku size color price salePrice stock status",
      })
      .session(session);

    if (!cart?.items.length) {
      const error = new Error("Cart is empty");
      error.statusCode = 400;
      throw error;
    }

    const orderItems = [];

    for (const cartItem of cart.items) {
      const { variantId: variant, productId: product } = cartItem;

      if (!variant || !product) {
        const error = new Error("Product or variant not found");
        error.statusCode = 400;
        throw error;
      }

      validateVariantStatus(variant);
      validateStockAvailability(variant, cartItem.quantity, product.name);

      const pricing = calculateItemPricing(variant, cartItem.quantity);
      const orderItem = createOrderItem(
        product,
        variant,
        cartItem.quantity,
        pricing
      );
      orderItems.push(orderItem);
    }

    const totals = calculateOrderTotals(orderItems);

    if (paymentMethod === "cod") {
      validateCODLimit(totals.totalAmount, businessRules.codLimit);
    }

    const { shortOrderId, orderNumber } = await generateOrderNumbers(Order);

    const order = new Order({
      userId,
      items: orderItems,
      ...totals,
      shippingAddress,
      billingAddress: finalBillingAddress,
      paymentMethod,
      shortOrderId,
      orderNumber,
      notes: {
        customer: notes?.customer || "",
        internal: notes?.internal || "",
      },
      businessRules: {
        codLimit: businessRules.codLimit || 5000,
        allowCancellation: businessRules.allowCancellation !== false,
        allowReturn: businessRules.allowReturn !== false,
        returnWindowDays: businessRules.returnWindowDays || 7,
        allowExchange: businessRules.allowExchange !== false,
        exchangeWindowDays: businessRules.exchangeWindowDays || 7,
      },
      shipping: {
        method: shippingMethod,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      metadata: {
        source: "web",
        userAgent: orderData.userAgent,
        ipAddress: orderData.ipAddress,
        referrer: orderData.referrer,
      },
    });

    if (paymentMethod === "cod") {
      order.orderStatus = ORDER_STATUS_CONFIRMED;
      order.paymentStatus = "pending";
      order.confirmedAt = new Date();
    } else {
      order.orderStatus = ORDER_STATUS_PENDING;
      order.paymentStatus = "pending";
    }

    await order.save({ session });

    for (const item of orderItems) {
      await Variant.findByIdAndUpdate(
        item.variantId,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    await Cart.findOneAndUpdate({ userId }, { items: [] }, { session });

    const populatedOrder = await Order.findById(order._id)
      .populate({ path: "userId", select: "firstName lastName email phone" })
      .populate({ path: "items.productId", select: "name brand imageUrls" })
      .populate({
        path: "items.variantId",
        select: "sku size color price salePrice",
      })
      .session(session);

    await session.commitTransaction();

    try {
      const { subject, html } = generateOrderConfirmationEmail(
        populatedOrder,
        populatedOrder.userId
      );
      await sendEmail(populatedOrder.userId.email, { subject, body: html });
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }

    return populatedOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getUserOrders = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    paymentMethod,
    startDate,
    endDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const query = { userId };

  if (status) query.orderStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (paymentMethod) query.paymentMethod = paymentMethod;

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate({ path: "userId", select: "firstName lastName email phone" })
      .populate({ path: "items.productId", select: "name brand imageUrls" })
      .populate({
        path: "items.variantId",
        select: "sku size color price salePrice",
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      hasNextPage: page * limit < totalOrders,
      hasPrevPage: page > 1,
      limit,
    },
  };
};

const getOrderById = async (orderId, userId, isAdmin = false) => {
  if (!orderId) {
    const error = new Error("Order ID is required");
    error.statusCode = 400;
    throw error;
  }

  const query = isAdmin ? { _id: orderId } : { _id: orderId, userId };

  const order = await Order.findOne(query)
    .populate({ path: "userId", select: "firstName lastName email phone" })
    .populate({ path: "items.productId", select: "name brand imageUrls" })
    .populate({
      path: "items.variantId",
      select: "sku size color price salePrice",
    });

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return order;
};

// ========== ADMIN OPERATIONS ==========

const getAllOrders = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    paymentMethod,
    startDate,
    endDate,
    userId,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const query = {};

  if (status) query.orderStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (userId) query.userId = userId;

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate({ path: "userId", select: "firstName lastName email phone" })
      .populate({ path: "items.productId", select: "name brand imageUrls" })
      .populate({
        path: "items.variantId",
        select: "sku size color price salePrice",
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      hasNextPage: page * limit < totalOrders,
      hasPrevPage: page > 1,
      limit,
    },
  };
};

const getOrderStats = async (options = {}) => {
  const { startDate, endDate, userId } = options;

  const query = {};

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (userId) query.userId = userId;

  const [
    totalOrders,
    confirmedOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    codOrders,
    onlineOrders,
    ordersByStatus,
    dailyStats,
  ] = await Promise.all([
    Order.countDocuments(query),
    Order.countDocuments({ ...query, orderStatus: "confirmed" }),
    Order.countDocuments({ ...query, orderStatus: "pending" }),
    Order.countDocuments({ ...query, orderStatus: "delivered" }),
    Order.countDocuments({ ...query, orderStatus: "cancelled" }),
    Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments({ ...query, paymentMethod: "cod" }),
    Order.countDocuments({ ...query, paymentMethod: { $ne: "cod" } }),
    Order.aggregate([
      { $match: query },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]),
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
  const averageOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  return {
    overview: {
      totalOrders,
      confirmedOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: revenue,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      codOrders,
      onlineOrders,
    },
    statusBreakdown: ordersByStatus,
    dailyStats: dailyStats.reverse(),
    conversionRate:
      totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
  };
};

const getOrderStatusFlow = async () => {
  const statusFlow = {};

  for (const [status, allowedTransitions] of Object.entries(
    ORDER_STATUS_FLOW
  )) {
    statusFlow[status] = {
      status,
      description: ORDER_STATUS_DESCRIPTIONS[status],
      allowedTransitions,
      allowedTransitionsDetails: allowedTransitions.map((transition) => ({
        status: transition,
        description: ORDER_STATUS_DESCRIPTIONS[transition],
      })),
      isTerminal: allowedTransitions.length === 0,
      canBeCancelled: status === "pending" || status === "confirmed",
      canBeReturned: status === "delivered",
      canBeExchanged: status === "delivered",
      requiresAction:
        status === "pending" ||
        status === "confirmed" ||
        status === "processing",
      isCompleted:
        status === "delivered" ||
        status === "exchanged" ||
        status === "refunded",
    };
  }

  return {
    statusFlow,
    summary: {
      totalStatuses: Object.keys(ORDER_STATUS_FLOW).length,
      terminalStatuses: Object.keys(ORDER_STATUS_FLOW).filter(
        (status) => ORDER_STATUS_FLOW[status].length === 0
      ),
      activeStatuses: Object.keys(ORDER_STATUS_FLOW).filter(
        (status) => ORDER_STATUS_FLOW[status].length > 0
      ),
      workflowStages: {
        initial: ["pending"],
        processing: ["confirmed", "processing", "shipped"],
        completed: ["delivered", "exchanged", "refunded"],
        cancelled: ["cancelled"],
        returned: ["returned"],
      },
    },
  };
};

const updateOrderStatus = async (
  orderId,
  userId,
  status,
  reason,
  isAdmin = false
) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    // Re-fetch order within this transaction session to ensure atomicity
    const orderQuery = isAdmin ? { _id: orderId } : { _id: orderId, userId };

    const order = await applyOrderPopulate(
      Order.findOne(orderQuery).session(session)
    );

    if (!order) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }

    const previousStatus = order.orderStatus;

    // Validate status transition
    if (!isValidStatusTransition(previousStatus, status, isAdmin)) {
      const error = new Error(
        `Invalid status transition from ${previousStatus} to ${status}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Business logic validation
    validateStatusChange(order, status);

    // Apply status update & business side-effects directly on the document so that pre-save hooks & history work
    order.orderStatus = status;

    // Add status-specific fields / side-effects
    switch (status) {
      case ORDER_STATUS_CANCELLED:
        order.cancellation = {
          cancelledAt: new Date(),
          cancelledBy: userId,
          reason: reason || "Order cancelled",
        };
        // Restore stock
        for (const item of order.items) {
          await Variant.findByIdAndUpdate(
            item.variantId,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
        break;
      case ORDER_STATUS_CONFIRMED:
        order.confirmedAt = new Date();
        break;
      case ORDER_STATUS_PROCESSING:
        order.processedAt = new Date();
        break;
      case ORDER_STATUS_SHIPPED:
        order.shippedAt = new Date();
        break;
      case ORDER_STATUS_DELIVERED:
        order.deliveredAt = new Date();
        break;
      case ORDER_STATUS_RETURNED:
        order.return = {
          returnRequestedAt: new Date(),
          returnReason: reason || "Return requested",
          returnStatus: "pending",
        };
        break;
    }

    // Provide context for statusHistory pre-save hook
    order._statusUpdatedBy = userId;
    order._statusUpdateReason = reason;

    const updatedOrder = await order.save({ session });

    await session.commitTransaction();

    // Send status notification
    try {
      const { subject, html } = generateOrderStatusEmail(
        updatedOrder,
        updatedOrder.userId,
        status,
        previousStatus
      );
      await sendEmail(updatedOrder.userId.email, { subject, body: html });
    } catch (emailError) {
      console.error(
        "Failed to send order status notification email:",
        emailError
      );
    }

    return updatedOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const requestExchange = async (orderId, userId, exchangeData) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    // Ensure we read within the same transaction session
    const order = await getOrderById(orderId, userId);

    if (!order.canBeExchanged()) {
      const error = new Error("Order cannot be exchanged at this stage");
      error.statusCode = 400;
      throw error;
    }

    const { exchangeType, exchangeReason, exchangeItems, customerNotes } =
      exchangeData;

    validateExchangeItems(exchangeItems);

    // Validate exchange items and calculate price difference
    let totalNewPrice = 0;

    for (const item of exchangeItems) {
      // Get original item
      const originalItem = order.items.find(
        (orderItem) => orderItem._id.toString() === item.originalItemId
      );
      if (!originalItem) {
        const error = new Error("Original item not found for exchange");
        error.statusCode = 400;
        throw error;
      }

      // Get new variant
      const newVariant = await Variant.findById(item.newVariantId).session(
        session
      );
      if (!newVariant || newVariant.status !== "active") {
        const error = new Error(
          `New variant ${item.newVariantId} is not available`
        );
        error.statusCode = 400;
        throw error;
      }

      if (newVariant.stock < item.newQuantity) {
        const error = new Error(
          `Insufficient stock for new variant ${newVariant.sku}`
        );
        error.statusCode = 400;
        throw error;
      }

      // Calculate new item price and enrich exchange item with original details
      const newItemPrice =
        (newVariant.salePrice || newVariant.price) * item.newQuantity;
      totalNewPrice += newItemPrice;

      // Update the exchange item with the correct original item ID
      item.originalItemId = originalItem._id;
      item.originalProductId = originalItem.productId;
      item.originalVariantId = originalItem.variantId;
      item.originalQuantity = originalItem.quantity;
    }

    // Calculate price difference using helper
    const { totalOriginalPrice } = calculateExchangePricing(
      order.items,
      exchangeItems
    );
    const priceDifference = totalNewPrice - totalOriginalPrice;
    const shippingCost = calculateShippingCost(totalNewPrice);
    const totalNewAmount = totalNewPrice + shippingCost;

    // Update order with exchange request
    order.orderStatus = ORDER_STATUS_EXCHANGE_REQUESTED;
    order.exchange = {
      exchangeRequestedAt: new Date(),
      exchangeReason,
      exchangeType,
      exchangeStatus: "pending",
      exchangeItems,
      customerNotes,
      priceDifference,
      originalTotal: totalOriginalPrice,
      newTotal: totalNewAmount,
      shippingCost,
    };

    await order.save({ session });
    await session.commitTransaction();

    // Send exchange request notification
    try {
      const { subject, html } = generateOrderStatusEmail(
        order,
        order.userId,
        ORDER_STATUS_EXCHANGE_REQUESTED,
        ORDER_STATUS_DELIVERED
      );
      await sendEmail(order.userId.email, { subject, body: html });
    } catch (emailError) {
      console.error(
        "Failed to send exchange request notification email:",
        emailError
      );
    }

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const approveExchange = async (orderId, approvalData) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const order = await getOrderById(orderId, null, true);

    if (order.orderStatus !== ORDER_STATUS_EXCHANGE_REQUESTED) {
      const error = new Error("Order is not in exchange requested status");
      error.statusCode = 400;
      throw error;
    }

    const { adminNotes, exchangeTrackingNumber, exchangeCarrier } =
      approvalData;

    // Calculate exchange pricing
    let exchangeSubtotal = 0;
    const exchangeItems = [];

    for (const exchangeItem of order.exchange.exchangeItems) {
      // Get original item details
      const originalItem = order.items.find(
        (item) => item._id.toString() === exchangeItem.originalItemId.toString()
      );
      if (!originalItem) {
        const error = new Error("Original item not found for exchange");
        error.statusCode = 400;
        throw error;
      }

      // Get new variant details
      const newVariant = await Variant.findById(
        exchangeItem.newVariantId
      ).session(session);
      if (!newVariant) {
        const error = new Error("New variant not found");
        error.statusCode = 400;
        throw error;
      }
      // Re-validate availability and stock at approval time
      if (newVariant.status !== "active") {
        const error = new Error(`Variant ${newVariant.sku} is not available`);
        error.statusCode = 400;
        throw error;
      }
      if (newVariant.stock < exchangeItem.newQuantity) {
        const error = new Error(
          `Insufficient stock for variant ${newVariant.sku}. Available: ${newVariant.stock}`
        );
        error.statusCode = 400;
        throw error;
      }

      // Calculate pricing
      const pricing = calculateItemPricing(
        newVariant,
        exchangeItem.newQuantity
      );
      const exchangeItemData = createOrderItem(
        { _id: exchangeItem.newProductId },
        newVariant,
        exchangeItem.newQuantity,
        pricing
      );

      exchangeItems.push(exchangeItemData);
      exchangeSubtotal += pricing.totalPrice;

      // Decrement stock for the new variant as items are being reissued
      await Variant.findByIdAndUpdate(
        newVariant._id,
        { $inc: { stock: -exchangeItem.newQuantity } },
        { session }
      );
    }

    // Calculate price difference using helper
    const { totalOriginalPrice } = calculateExchangePricing(
      order.items,
      order.exchange.exchangeItems
    );
    const priceDifference = exchangeSubtotal - totalOriginalPrice;
    const exchangeShippingCost = calculateShippingCost(exchangeSubtotal);
    const exchangeTotalAmount = exchangeSubtotal + exchangeShippingCost;

    // Create exchange order data using helper
    const exchangeOrderData = await createExchangeOrderData(
      order,
      exchangeItems,
      {
        subtotal: exchangeSubtotal,
        discountTotal: exchangeItems.reduce(
          (sum, item) => sum + item.discountAmount,
          0
        ),
        shippingCost: exchangeShippingCost,
        totalAmount: exchangeTotalAmount,
        priceDifference,
        originalTotal: totalOriginalPrice,
      },
      adminNotes,
      Order
    );

    const exchangeOrder = new Order(exchangeOrderData);
    await exchangeOrder.save({ session });

    // Update original order
    order.orderStatus = ORDER_STATUS_EXCHANGE_APPROVED;
    order.exchange.exchangeStatus = "approved";
    order.exchange.exchangeOrderId = exchangeOrder._id;
    order.exchange.exchangeTrackingNumber = exchangeTrackingNumber;
    order.exchange.exchangeCarrier = exchangeCarrier;
    order.exchange.adminNotes = adminNotes;

    await order.save({ session });
    await session.commitTransaction();

    // Send exchange approval notification
    try {
      const { subject, html } = generateOrderStatusEmail(
        order,
        order.userId,
        ORDER_STATUS_EXCHANGE_APPROVED,
        ORDER_STATUS_EXCHANGE_REQUESTED
      );
      await sendEmail(order.userId.email, { subject, body: html });
    } catch (emailError) {
      console.error(
        "Failed to send exchange approval notification email:",
        emailError
      );
    }

    return {
      originalOrder: order,
      exchangeOrder,
      priceDifference,
      customerPaymentRequired: priceDifference > 0 ? priceDifference : 0,
      customerRefundAmount: priceDifference < 0 ? Math.abs(priceDifference) : 0,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const rejectExchange = async (orderId, rejectionData) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const order = await getOrderById(orderId, null, true);

    if (order.orderStatus !== ORDER_STATUS_EXCHANGE_REQUESTED) {
      const error = new Error("Order is not in exchange requested status");
      error.statusCode = 400;
      throw error;
    }

    const { adminNotes } = rejectionData;

    order.orderStatus = ORDER_STATUS_DELIVERED;
    order.exchange.exchangeStatus = "rejected";
    order.exchange.adminNotes = adminNotes;

    await order.save({ session });
    await session.commitTransaction();

    // Send exchange rejection notification
    try {
      const { subject, html } = generateOrderStatusEmail(
        order,
        order.userId,
        ORDER_STATUS_DELIVERED,
        ORDER_STATUS_EXCHANGE_REQUESTED
      );
      await sendEmail(order.userId.email, { subject, body: html });
    } catch (emailError) {
      console.error(
        "Failed to send exchange rejection notification email:",
        emailError
      );
    }

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const completeExchange = async (orderId) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const order = await getOrderById(orderId, null, true);

    if (order.orderStatus !== ORDER_STATUS_EXCHANGE_APPROVED) {
      const error = new Error(
        `Order is not in exchange approved status. Current status: "${order.orderStatus}", Expected: "${ORDER_STATUS_EXCHANGE_APPROVED}"`
      );
      error.statusCode = 400;
      throw error;
    }

    // Update original order
    order.orderStatus = ORDER_STATUS_EXCHANGED;
    order.exchange.exchangeStatus = "completed";
    await order.save({ session });

    // Restore stock for original items being returned
    if (order.exchange?.exchangeItems?.length) {
      for (const item of order.exchange.exchangeItems) {
        if (item.originalVariantId && item.originalQuantity > 0) {
          await Variant.findByIdAndUpdate(
            item.originalVariantId,
            { $inc: { stock: item.originalQuantity } },
            { session }
          );
        }
      }
    }

    // Update exchange order if it exists
    let exchangeOrder = null;
    if (order.exchange.exchangeOrderId) {
      exchangeOrder = await Order.findById(
        order.exchange.exchangeOrderId
      ).session(session);
      if (exchangeOrder) {
        // Set exchange order payment state based on price difference
        const priceDiff = order.exchange?.priceDifference || 0;
        exchangeOrder.orderStatus = ORDER_STATUS_CONFIRMED;
        if (priceDiff > 0) {
          exchangeOrder.paymentStatus = "pending";
          exchangeOrder.amountPaid = 0;
        } else {
          exchangeOrder.paymentStatus = "paid";
          exchangeOrder.amountPaid = exchangeOrder.totalAmount;
        }
        await exchangeOrder.save({ session });
      }
    }

    await session.commitTransaction();

    // Send exchange completion notification
    try {
      const { subject, html } = generateOrderStatusEmail(
        order,
        order.userId,
        ORDER_STATUS_EXCHANGED,
        ORDER_STATUS_EXCHANGE_APPROVED
      );
      await sendEmail(order.userId.email, { subject, body: html });
    } catch (emailError) {
      console.error(
        "Failed to send exchange completion notification email:",
        emailError
      );
    }

    return { originalOrder: order, exchangeOrder };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

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

const hasUserDeliveredProduct = async (userId, productId) => {
  try {
    const deliveredOrder = await Order.findOne({
      userId,
      "items.productId": productId,
      orderStatus: ORDER_STATUS_DELIVERED,
      paymentStatus: "paid",
    }).select("_id");

    return !!deliveredOrder;
  } catch (error) {
    console.error("Error checking user delivery status:", error);
    return false;
  }
};

export default {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getOrderStats,
  getOrderStatusFlow,
  updateOrderStatus,
  requestExchange,
  approveExchange,
  rejectExchange,
  completeExchange,
  confirmCODPayment,
  hasUserDeliveredProduct,
};
