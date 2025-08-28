import orderService from "../services/orderService.js";

//Formatter
import {
  formatOrderResponse,
  formatOrderListResponse,
  formatOrderStatsResponse,
} from "../helpers/dataFormatter.js";

const createOrder = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const orderData = req.body;

    if (!orderData.shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required.",
      });
    }

    const order = await orderService.createOrder(loggedInUser, orderData);

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order: formatOrderResponse(order),
    });
  } catch (error) {
    console.error("Error creating order:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const query = req.query;

    const { orders, pagination } = await orderService.getUserOrders(
      loggedInUser,
      query
    );

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      orders: formatOrderListResponse(orders),
      pagination,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    const order = await orderService.getOrderById(orderId, loggedInUser);

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully.",
      order: formatOrderResponse(order),
    });
  } catch (error) {
    console.error("Error fetching order:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// ========== ADMIN CONTROLLERS ==========

const getAllOrders = async (req, res) => {
  try {
    const query = req.query;

    const { orders, pagination } = await orderService.getAllOrders(query);

    return res.status(200).json({
      success: true,
      message: "All orders fetched successfully.",
      orders: formatOrderListResponse(orders),
      pagination,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getOrderByIdAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    const order = await orderService.getOrderById(orderId, null, true);

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully.",
      order: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getOrderStats = async (req, res) => {
  try {
    const query = req.query;

    const stats = await orderService.getOrderStats(query);

    return res.status(200).json({
      success: true,
      message: "Order statistics fetched successfully.",
      stats: formatOrderStatsResponse(stats),
    });
  } catch (error) {
    console.error("Error fetching order statistics:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getOrderStatusFlow = async (req, res) => {
  try {
    const statusFlow = await orderService.getOrderStatusFlow();

    return res.status(200).json({
      success: true,
      message: "Order status flow fetched successfully.",
      statusFlow,
    });
  } catch (error) {
    console.error("Error fetching order status flow:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const orderId = req.params.id;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required.",
      });
    }

    const order = await orderService.updateOrderStatus(
      orderId,
      loggedInUser,
      status,
      reason
    );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const updateOrderStatusAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required.",
      });
    }

    const order = await orderService.updateOrderStatus(
      orderId,
      null,
      status,
      reason,
      true
    );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const requestExchange = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const orderId = req.params.id;
    const exchangeData = req.body;

    if (
      !exchangeData.exchangeItems ||
      exchangeData.exchangeItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Exchange items are required.",
      });
    }

    const order = await orderService.requestExchange(
      orderId,
      loggedInUser,
      exchangeData
    );

    return res.status(200).json({
      success: true,
      message: "Exchange requested successfully.",
      order: order,
    });
  } catch (error) {
    console.error("Error requesting exchange:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const approveExchange = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { adminNotes, exchangeTrackingNumber, exchangeCarrier } = req.body;

    const result = await orderService.approveExchange(orderId, {
      adminNotes,
      exchangeTrackingNumber,
      exchangeCarrier,
    });

    return res.status(200).json({
      success: true,
      message: "Exchange approved successfully.",
      originalOrder: result.originalOrder,
      exchangeOrder: result.exchangeOrder,
      priceDifference: result.priceDifference,
      customerPaymentRequired: result.customerPaymentRequired,
      customerRefundAmount: result.customerRefundAmount,
    });
  } catch (error) {
    console.error("Error approving exchange:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const rejectExchange = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { adminNotes } = req.body;

    const order = await orderService.rejectExchange(orderId, { adminNotes });

    return res.status(200).json({
      success: true,
      message: "Exchange rejected successfully.",
      order: order,
    });
  } catch (error) {
    console.error("Error rejecting exchange:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const completeExchange = async (req, res) => {
  try {
    const orderId = req.params.id;

    const result = await orderService.completeExchange(orderId);

    return res.status(200).json({
      success: true,
      message: "Exchange completed successfully.",
      originalOrder: result.originalOrder,
      exchangeOrder: result.exchangeOrder,
      exchangeSummary: {
        originalOrderId: result.originalOrder.shortOrderId,
        exchangeOrderId: result.exchangeOrder?.shortOrderId,
        exchangeStatus: result.originalOrder.exchange.exchangeStatus,
        exchangeCompletedAt: result.originalOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error completing exchange:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export default {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getOrderByIdAdmin,
  getOrderStats,
  getOrderStatusFlow,
  updateOrderStatus,
  updateOrderStatusAdmin,
  requestExchange,
  approveExchange,
  rejectExchange,
  completeExchange,
};
