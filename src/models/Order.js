import mongoose from "mongoose";

import {
  ORDER_STATUS_CANCELLED,
  ORDER_STATUS_CONFIRMED,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_EXCHANGED,
  ORDER_STATUS_EXCHANGE_APPROVED,
  ORDER_STATUS_EXCHANGE_REQUESTED,
  ORDER_STATUS_PENDING,
  ORDER_STATUS_PROCESSING,
  ORDER_STATUS_REFUNDED,
  ORDER_STATUS_RETURNED,
  ORDER_STATUS_SHIPPED,
} from "../constants/orderStatus.js";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    shortOrderId: { type: String, unique: true, index: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variant",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },

        // Pricing
        unitPrice: { type: Number, required: true, min: 0 },
        salePrice: { type: Number, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
        discountAmount: { type: Number, default: 0, min: 0 },
        taxAmount: { type: Number, default: 0, min: 0 },

        originalStock: { type: Number, required: true },
      },
    ],

    // Aggregated totals
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    amountRefunded: { type: Number, default: 0, min: 0 },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      streetAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "Nepal" },
      addressType: {
        type: String,
        enum: ["home", "office", "other"],
        default: "home",
      },
      notes: String,
    },

    billingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      streetAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "Nepal" },
      addressType: {
        type: String,
        enum: ["home", "office", "other"],
        default: "home",
      },
      notes: String,
    },

    paymentMethod: {
      type: String,
      enum: ["khalti", "cod", "bank_transfer", "esewa"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },
    paymentDetails: {
      transactionId: String,
      paymentDate: Date,
      paymentGateway: String,
      gatewayResponse: mongoose.Schema.Types.Mixed,
    },

    orderStatus: {
      type: String,
      enum: [
        ORDER_STATUS_CANCELLED,
        ORDER_STATUS_CONFIRMED,
        ORDER_STATUS_DELIVERED,
        ORDER_STATUS_EXCHANGED,
        ORDER_STATUS_EXCHANGE_APPROVED,
        ORDER_STATUS_EXCHANGE_REQUESTED,
        ORDER_STATUS_PENDING,
        ORDER_STATUS_PROCESSING,
        ORDER_STATUS_REFUNDED,
        ORDER_STATUS_RETURNED,
        ORDER_STATUS_SHIPPED,
      ],
      default: ORDER_STATUS_PENDING,
    },

    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: String,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],

    shipping: {
      method: {
        type: String,
        enum: ["standard", "express", "same_day"],
        default: "standard",
      },
      trackingNumber: String,
      carrier: String,
      estimatedDelivery: Date,
      actualDelivery: Date,
      shippingNotes: String,
    },

    codDetails: {
      amountReceived: Number,
      deliveryAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      paymentDate: Date,
      deliveryNotes: String,
      agentSignature: String,
      customerSignature: String,
    },

    cancellation: {
      cancelledAt: Date,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: String,
      refundAmount: Number,
      refundMethod: String,
      refundDate: Date,
    },

    return: {
      returnRequestedAt: Date,
      returnReason: String,
      returnStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "completed"],
      },
      returnItems: [
        {
          itemId: mongoose.Schema.Types.ObjectId,
          quantity: Number,
          reason: String,
          condition: String,
        },
      ],
      returnTrackingNumber: String,
      returnCarrier: String,
    },

    exchange: {
      exchangeRequestedAt: Date,
      exchangeReason: String,
      exchangeType: { type: String, enum: ["size", "color"] },
      exchangeStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "in_progress", "completed"],
      },
      exchangeItems: [
        {
          originalItemId: mongoose.Schema.Types.ObjectId,
          originalProductId: mongoose.Schema.Types.ObjectId,
          originalVariantId: mongoose.Schema.Types.ObjectId,
          originalQuantity: Number,
          newProductId: mongoose.Schema.Types.ObjectId,
          newVariantId: mongoose.Schema.Types.ObjectId,
          newQuantity: Number,
          reason: String,
          condition: String,
        },
      ],
      exchangeOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      exchangeTrackingNumber: String,
      exchangeCarrier: String,
      adminNotes: String,
      customerNotes: String,
      priceDifference: Number,
      originalTotal: Number,
      newTotal: Number,
      shippingCost: Number,
    },

    businessRules: {
      codLimit: { type: Number, default: 5000 },
      allowCancellation: { type: Boolean, default: true },
      allowReturn: { type: Boolean, default: true },
      returnWindowDays: { type: Number, default: 7 },
      allowExchange: { type: Boolean, default: true },
      exchangeWindowDays: { type: Number, default: 7 },
    },

    notes: { customer: String, internal: String },

    confirmedAt: Date,
    processedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,

    metadata: {
      source: { type: String, default: "web" },
      userAgent: String,
      ipAddress: String,
      referrer: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* -------------------------------
   Virtuals
-------------------------------- */
orderSchema.virtual("orderSummary").get(function () {
  return {
    totalItems: this.items.reduce((sum, item) => sum + item.quantity, 0),
    uniqueProducts: this.items.length,
    isFullyPaid: this.amountPaid >= this.totalAmount,
    isFullyRefunded: this.amountRefunded >= this.totalAmount,
    remainingAmount: this.totalAmount - this.amountPaid,
  };
});

orderSchema.virtual("orderAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

/* -------------------------------
   Middleware
-------------------------------- */
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory = [
      {
        status: this.orderStatus,
        timestamp: new Date(),
        notes: "Order created",
      },
    ];
  }

  if (this.isModified("orderStatus")) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      updatedBy: this._statusUpdatedBy || undefined,
      notes: this._statusUpdateReason || "Status updated",
    });
  }

  next();
});

/* -------------------------------
   Methods
-------------------------------- */
orderSchema.methods.canBeCancelled = function () {
  const cancellableStatuses = [ORDER_STATUS_PENDING, ORDER_STATUS_CONFIRMED];

  return (
    cancellableStatuses.includes(this.orderStatus) &&
    this.businessRules.allowCancellation
  );
};

orderSchema.methods.canBeReturned = function () {
  if (
    !this.businessRules.allowReturn ||
    this.orderStatus !== ORDER_STATUS_DELIVERED
  )
    return false;

  const returnWindow = this.businessRules.returnWindowDays;
  const daysSinceDelivery = Math.floor(
    (Date.now() - this.deliveredAt) / (1000 * 60 * 60 * 24)
  );

  return daysSinceDelivery <= returnWindow;
};

orderSchema.methods.canBeExchanged = function () {
  if (
    !this.businessRules.allowExchange ||
    this.orderStatus !== ORDER_STATUS_DELIVERED
  )
    return false;

  const exchangeWindow = this.businessRules.exchangeWindowDays || 7;
  const daysSinceDelivery = Math.floor(
    (Date.now() - this.deliveredAt) / (1000 * 60 * 60 * 24)
  );

  return daysSinceDelivery <= exchangeWindow;
};

orderSchema.methods.updatePaymentStatus = function (amount, status) {
  this.amountPaid = amount;
  this.paymentStatus = status;
  if (status === "paid") this.paymentDetails.paymentDate = new Date();
};

/* -------------------------------
   Indexes
-------------------------------- */
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ "shipping.trackingNumber": 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
