export const generateOrderStatusEmail = (
  order,
  user,
  newStatus,
  previousStatus
) => {
  const subject = `Order Status Updated - ${order.shortOrderId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Status Updated</h2>
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>Your order <strong>${order.shortOrderId}</strong> status has been updated.</p>
      <p><strong>Previous Status:</strong> ${previousStatus}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
      <p>Thank you for choosing Nepwears!</p>
    </div>`;

  return { subject, html };
};
