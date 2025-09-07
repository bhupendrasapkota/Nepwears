export function formatAuthResponse(data) {
  return {
    id: data._id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    roles: data.roles,
    status: data.status,
  };
}

export function formatVariantResponse(variant) {
  return {
    variantId: variant._id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    price: variant.price,
    salePrice: variant.salePrice,
    isOnSale: variant.isOnSale,
    discountPercentage: variant.discountPercentage,
    variantImageUrls: variant.imageUrls,
    stock: variant.stock,
    status: variant.status,
    isPrimary: variant.isPrimary,
  };
}

export function formatAllProductResponse({ product, variant }) {
  return {
    id: product._id,
    name: product.name,
    brand: product.brand,
    ratings: product.ratings,
    imageUrls: product.imageUrls,
    totalVariants: product.variants,
    ...formatVariantResponse(variant),
  };
}

export function formatProductDetailResponse({
  product,
  primaryVariant,
  variants,
}) {
  return {
    product: {
      id: product._id,
      name: product.name,
      brand: product.brand,
      ratings: product.ratings,
      descriptions: product.descriptions,
      specifications: product.specifications,
      totalVariants: product.variants,
    },
    primaryVariant: formatVariantResponse(primaryVariant),
    variants: variants.map(formatVariantResponse),
  };
}

export function formatCategoryResponse(collection) {
  return {
    id: collection._id,
    title: collection.title,
    imageUrl: collection.imageUrl,
  };
}

export function formatCollectionResponse(collection) {
  return {
    ...formatCategoryResponse(collection),
    products: collection.products.map(formatAllProductResponse),
  };
}

export function formatCartResponse(cart) {
  return cart.items.map((item) => {
    const product = item.productId;
    const variant = item.variantId;

    return {
      itemId: item._id,
      name: product.name,
      brand: product.brand,
      imageUrls: variant.imageUrls[0],
      color: variant.color,
      size: variant.size,
      price: variant.salePrice ?? variant.price,
      originalPrice: variant.price,
      quantity: item.quantity,
    };
  });
}

export function formatAddressResponse(address) {
  return {
    id: address._id,
    fullName: address.fullName,
    phone: address.phone,
    streetAddress: address.streetAddress,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    addressType: address.addressType,
    isDefault: address.isDefault,
    notes: address.notes,
    createdAt: address.createdAt,
  };
}

export function formatOrderResponse(order) {
  return {
    id: order._id,
    shortOrderId: order.shortOrderId,
    orderNumber: order.orderNumber,
    userId: {
      id: order.userId._id,
      firstName: order.userId.firstName,
      lastName: order.userId.lastName,
      email: order.userId.email,
      phone: order.userId.phone,
    },
    items: order.items.map((item) => ({
      itemId: item._id,
      product: {
        id: item.productId._id,
        name: item.productId.name,
        brand: item.productId.brand,
        imageUrls: item.productId.imageUrls,
      },
      variant: {
        id: item.variantId._id,
        sku: item.variantId.sku,
        size: item.variantId.size,
        color: item.variantId.color,
        price: item.variantId.price,
        salePrice: item.variantId.salePrice,
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      salePrice: item.salePrice,
      totalPrice: item.totalPrice,
      discountAmount: item.discountAmount,
      taxAmount: item.taxAmount,
      originalStock: item.originalStock,
    })),
    pricing: {
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxTotal: order.taxTotal,
      shippingCost: order.shippingCost,
      totalAmount: order.totalAmount,
      amountPaid: order.amountPaid,
      amountRefunded: order.amountRefunded,
    },
    addresses: {
      shipping: {
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        streetAddress: order.shippingAddress.streetAddress,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        addressType: order.shippingAddress.addressType,
        notes: order.shippingAddress.notes,
      },
      billing: order.billingAddress
        ? {
            fullName: order.billingAddress.fullName,
            phone: order.billingAddress.phone,
            streetAddress: order.billingAddress.streetAddress,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
            postalCode: order.billingAddress.postalCode,
            country: order.billingAddress.country,
            addressType: order.billingAddress.addressType,
            notes: order.billingAddress.notes,
          }
        : null,
    },
    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      details: order.paymentDetails
        ? {
            transactionId: order.paymentDetails.transactionId,
            paymentDate: order.paymentDetails.paymentDate,
            paymentGateway: order.paymentDetails.paymentGateway,
          }
        : null,
    },
    orderStatus: {
      current: order.orderStatus,
      history: order.statusHistory,
      confirmedAt: order.confirmedAt,
      processedAt: order.processedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
    },
    shipping: {
      method: order.shipping.method,
      trackingNumber: order.shipping.trackingNumber,
      carrier: order.shipping.carrier,
      estimatedDelivery: order.shipping.estimatedDelivery,
      actualDelivery: order.shipping.actualDelivery,
      notes: order.shipping.shippingNotes,
    },
    businessRules: order.businessRules,
    notes: order.notes,
    metadata: order.metadata,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function formatPaymentResponse(paymentData, type = "khalti") {
  if (type === "khalti") {
    return {
      paymentId: paymentData.pidx,
      orderId: paymentData.purchase_order_id,
      amount: paymentData.amount / 100, // Convert from paisa to rupees
      status: paymentData.status,
      paymentUrl: paymentData.payment_url,
      expiresAt: paymentData.expires_at,
      customerInfo: paymentData.customer_info,
      returnUrl: paymentData.return_url,
      websiteUrl: paymentData.website_url,
    };
  }

  if (type === "refund") {
    return {
      refundId: paymentData.refundId,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      status: paymentData.status,
      reason: paymentData.reason,
      totalRefunded: paymentData.totalRefunded,
      paymentStatus: paymentData.paymentStatus,
      processedBy: paymentData.processedBy,
    };
  }

  if (type === "cod") {
    return {
      orderId: paymentData._id,
      shortOrderId: paymentData.shortOrderId,
      orderStatus: paymentData.orderStatus,
      paymentStatus: paymentData.paymentStatus,
      amountPaid: paymentData.amountPaid,
      totalAmount: paymentData.totalAmount,
      codDetails: {
        amountReceived: paymentData.codDetails.amountReceived,
        paymentDate: paymentData.codDetails.paymentDate,
        deliveryNotes: paymentData.codDetails.deliveryNotes,
        agentSignature: paymentData.codDetails.agentSignature,
        customerSignature: paymentData.codDetails.customerSignature,
      },
    };
  }

  return paymentData;
}

export function formatOrderListResponse(orders) {
  return orders.map((order) => ({
    id: order._id,
    shortOrderId: order.shortOrderId,
    orderNumber: order.orderNumber,
    customer: {
      name: `${order.userId.firstName} ${order.userId.lastName}`,
      email: order.userId.email,
      phone: order.userId.phone,
    },
    items: order.items.map((item) => ({
      productName: item.productId.name,
      variant: `${item.variantId.size} - ${item.variantId.color}`,
      quantity: item.quantity,
      price: item.totalPrice,
    })),
    totalAmount: order.totalAmount,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));
}

export function formatOrderStatsResponse(stats) {
  return {
    totalOrders: stats.totalOrders,
    totalRevenue: stats.totalRevenue,
    averageOrderValue: stats.averageOrderValue,
    orderStatusBreakdown: stats.orderStatusBreakdown,
    paymentMethodBreakdown: stats.paymentMethodBreakdown,
    monthlyTrends: stats.monthlyTrends,
    topProducts: stats.topProducts,
    customerMetrics: {
      totalCustomers: stats.totalCustomers,
      repeatCustomers: stats.repeatCustomers,
      newCustomers: stats.newCustomers,
    },
  };
}

export function formatReviewResponse(review) {
  return {
    id: review._id,
    userId: {
      id: review.userId._id,
      firstName: review.userId.firstName,
      lastName: review.userId.lastName,
    },
    productId: review.productId._id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export function formatProductRatingResponse(ratingData) {
  return {
    average: ratingData.average,
    count: ratingData.count,
    distribution: ratingData.distribution,
    summary: {
      totalReviews: ratingData.count,
      averageRating: ratingData.average,
      ratingText:
        ratingData.average >= 4.5
          ? "Excellent"
          : ratingData.average >= 4.0
          ? "Very Good"
          : ratingData.average >= 3.5
          ? "Good"
          : ratingData.average >= 3.0
          ? "Average"
          : ratingData.average >= 2.0
          ? "Below Average"
          : "Poor",
    },
  };
}
