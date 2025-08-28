// constants/orderStatus.js
export const ORDER_STATUS_CANCELLED = "cancelled";
export const ORDER_STATUS_CONFIRMED = "confirmed";
export const ORDER_STATUS_DELIVERED = "delivered";
export const ORDER_STATUS_EXCHANGED = "exchanged";
export const ORDER_STATUS_EXCHANGE_APPROVED = "exchange_approved";
export const ORDER_STATUS_EXCHANGE_REQUESTED = "exchange_requested";
export const ORDER_STATUS_PENDING = "pending";
export const ORDER_STATUS_PROCESSING = "processing";
export const ORDER_STATUS_REFUNDED = "refunded";
export const ORDER_STATUS_RETURNED = "returned";
export const ORDER_STATUS_SHIPPED = "shipped";

export const ORDER_STATUS_FLOW = {
  [ORDER_STATUS_CANCELLED]: [],
  [ORDER_STATUS_CONFIRMED]: [ORDER_STATUS_PROCESSING, ORDER_STATUS_CANCELLED],
  [ORDER_STATUS_DELIVERED]: [
    ORDER_STATUS_RETURNED,
    ORDER_STATUS_REFUNDED,
    ORDER_STATUS_EXCHANGE_REQUESTED,
  ],
  [ORDER_STATUS_EXCHANGED]: [],
  [ORDER_STATUS_EXCHANGE_APPROVED]: [ORDER_STATUS_EXCHANGED],
  [ORDER_STATUS_EXCHANGE_REQUESTED]: [
    ORDER_STATUS_EXCHANGE_APPROVED,
    ORDER_STATUS_DELIVERED,
  ],
  [ORDER_STATUS_PENDING]: [ORDER_STATUS_CONFIRMED, ORDER_STATUS_CANCELLED],
  [ORDER_STATUS_PROCESSING]: [ORDER_STATUS_SHIPPED, ORDER_STATUS_CANCELLED],
  [ORDER_STATUS_REFUNDED]: [],
  [ORDER_STATUS_RETURNED]: [ORDER_STATUS_REFUNDED],
  [ORDER_STATUS_SHIPPED]: [ORDER_STATUS_DELIVERED, ORDER_STATUS_CANCELLED],
};

export const ORDER_STATUS_DESCRIPTIONS = {
  [ORDER_STATUS_CANCELLED]: "Order has been cancelled",
  [ORDER_STATUS_CONFIRMED]: "Order confirmed, preparing for processing",
  [ORDER_STATUS_DELIVERED]: "Order has been delivered",
  [ORDER_STATUS_EXCHANGED]: "Exchange completed",
  [ORDER_STATUS_EXCHANGE_APPROVED]: "Exchange approved by admin",
  [ORDER_STATUS_EXCHANGE_REQUESTED]: "Exchange requested by customer",
  [ORDER_STATUS_PENDING]: "Order placed, waiting for confirmation",
  [ORDER_STATUS_PROCESSING]: "Order is being processed",
  [ORDER_STATUS_REFUNDED]: "Order has been refunded",
  [ORDER_STATUS_RETURNED]: "Order has been returned",
  [ORDER_STATUS_SHIPPED]: "Order has been shipped",
};
