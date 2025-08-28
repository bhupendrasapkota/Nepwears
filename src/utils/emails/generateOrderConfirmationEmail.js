export const generateOrderConfirmationEmail = (order, user) => {
  const subject = `Order Confirmation - ${order.shortOrderId}`;

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:32px 24px; background:#fff; color:#111;">
    <h2 style="font-size:28px; font-weight:700; margin-bottom:24px; color:#000; letter-spacing:1px;">Order Confirmation 🛍️</h2>
    <p style="font-size:16px; margin-bottom:16px;">Dear ${user.firstName} ${
    user.lastName
  },</p>
    <p style="font-size:16px; margin-bottom:24px;">Thank you for your order! Your order has been successfully placed and is being processed.</p>
    <div style="background:#f5f5f5; padding:20px; border-radius:4px; margin-bottom:24px;">
      <h3 style="font-size:20px; font-weight:600; margin-bottom:16px; color:#000;">Order Details</h3>
      <p style="font-size:15px; margin-bottom:8px;"><strong>Order ID:</strong> ${
        order.shortOrderId
      }</p>
      <p style="font-size:15px; margin-bottom:8px;"><strong>Order Date:</strong> ${new Date(
        order.createdAt
      ).toLocaleDateString()}</p>
      <p style="font-size:15px; margin-bottom:8px;"><strong>Total Amount:</strong> Rs. ${
        order.totalAmount
      }</p>
      <p style="font-size:15px; margin-bottom:8px;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
      <p style="font-size:15px; margin-bottom:0;"><strong>Order Status:</strong> ${
        order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)
      }</p>
    </div>
    <div style="background:#f5f5f5; padding:20px; border-radius:4px; margin-bottom:24px;">
      <h3 style="font-size:20px; font-weight:600; margin-bottom:16px; color:#000;">Shipping Address</h3>
      <p style="font-size:15px; margin-bottom:8px;">${
        order.shippingAddress.fullName
      }</p>
      <p style="font-size:15px; margin-bottom:8px;">${
        order.shippingAddress.streetAddress
      }</p>
      <p style="font-size:15px; margin-bottom:8px;">${
        order.shippingAddress.city
      }, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
      <p style="font-size:15px; margin-bottom:8px;">${
        order.shippingAddress.country
      }</p>
      <p style="font-size:15px; margin-bottom:0;">Phone: ${
        order.shippingAddress.phone
      }</p>
    </div>
    <p style="font-size:16px; margin-bottom:24px;">We'll send you updates on your order status. If you have any questions, please contact our support team.</p>
    <hr style="border:none; border-top:1px solid #eee; margin:40px 0 24px 0;">
    <p style="font-size:12px; color:#aaa; text-align:center;">
      &copy; ${new Date().getFullYear()} Nepwears. All rights reserved.
    </p>
  </div>
  `;

  return { subject, html };
};
