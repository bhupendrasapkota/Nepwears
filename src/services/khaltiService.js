import axios from "axios";
import config from "../config/config.js";

// Initialize Khalti payment
const initiatePayment = async (orderData) => {
  try {
    // Validate config
    if (!config.khaltiSecretKey || !config.khaltiBaseUrl) {
      throw {
        status: 500,
        message: "Khalti configuration is missing",
      };
    }

    const { orderId, totalAmount, customerInfo } = orderData; // Changed from orderNumber to orderId

    const payload = {
      return_url: `${config.appUrl}/api/payments/khalti/verify`,
      website_url: config.appUrl,
      amount: totalAmount * 100,
      purchase_order_id: orderId, // Use orderId instead of orderNumber
      purchase_order_name: `Order ${orderId}`,
      customer_info: {
        name: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      },
    };

    const response = await axios.post(
      `${config.khaltiBaseUrl}/epayment/initiate/`,
      payload,
      {
        headers: {
          Authorization: `Key ${config.khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw {
      status: 500,
      message: `Khalti Error: ${error.response?.data?.detail || error.message}`,
    };
  }
};

// Verify Khalti payment
const verifyPayment = async (pidx) => {
  try {
    const response = await axios.post(
      `${config.khaltiBaseUrl}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `Key ${config.khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw {
      status: 500,
      message: `Khalti Error: ${error.response?.data?.detail || error.message}`,
    };
  }
};

// Refund Khalti payment
const refundPayment = async (pidx, amount, reason) => {
  try {
    if (config.nodeEnv !== "production") {
      // Sandbox/mock behavior for non-production
      return {
        refundId: `refund_${Date.now()}`,
        status: "success",
        amount,
        reason,
      };
    }

    // NOTE: Adjust endpoint and payload to Khalti's official refund API spec when available
    const response = await axios.post(
      `${config.khaltiBaseUrl}/epayment/refund/`,
      { pidx, amount, reason },
      {
        headers: {
          Authorization: `Key ${config.khaltiSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw {
      status: 500,
      message: `Refund Error: ${error.response?.data?.detail || error.message}`,
    };
  }
};

export default {
  initiatePayment,
  verifyPayment,
  refundPayment,
};
