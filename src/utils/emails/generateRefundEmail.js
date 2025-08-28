export const generateRefundEmail = (order, user, refundAmount) => {
  const subject = `Refund Processed - Order ${order.shortOrderId}`;

  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Processed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50;">Refund Processed</h1>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #27ae60; margin-top: 0;">Refund Details</h2>
            <p><strong>Order ID:</strong> ${order.shortOrderId}</p>
            <p><strong>Refund Amount:</strong> Rs. ${refundAmount}</p>
            <p><strong>Refund Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <h3 style="color: #2c3e50;">Order Summary</h3>
            <p><strong>Total Order Amount:</strong> Rs. ${order.totalAmount}</p>
            <p><strong>Amount Paid:</strong> Rs. ${order.amountPaid}</p>
            <p><strong>Total Refunded:</strong> Rs. ${order.amountRefunded}</p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #6c757d;">
            <p>Thank you for your business!</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

  return { subject, html };
};
