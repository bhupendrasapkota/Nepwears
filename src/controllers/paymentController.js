import paymentService from "../services/paymentService.js";
import orderService from "../services/orderService.js";

//Formatter
import {
  formatPaymentResponse,
  formatOrderResponse,
} from "../helpers/dataFormatter.js";

const initiateKhaltiPayment = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    const paymentData = await paymentService.initiateKhaltiPayment(
      orderId,
      loggedInUser
    );

    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully.",
      paymentData: formatPaymentResponse(paymentData, "khalti"),
    });
  } catch (error) {
    console.error("Error initiating Khalti payment:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const verifyKhaltiPayment = async (req, res) => {
  try {
    const pidx = req.body.pidx || req.query.pidx;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: "Payment ID (pidx) is required.",
      });
    }

    const verificationResult = await paymentService.verifyKhaltiPayment(pidx);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      verificationResult: formatPaymentResponse(verificationResult, "khalti"),
    });
  } catch (error) {
    console.error("Error verifying Khalti payment:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const confirmCODPayment = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const orderId = req.params.orderId;
    const paymentData = req.body;

    if (!paymentData.amountReceived) {
      return res.status(400).json({
        success: false,
        message: "Amount received is required.",
      });
    }

    if (!paymentData.agentSignature || !paymentData.customerSignature) {
      return res.status(400).json({
        success: false,
        message: "Agent and customer signatures are required.",
      });
    }

    const order = await orderService.confirmCODPayment(
      orderId,
      loggedInUser,
      paymentData
    );

    return res.status(200).json({
      success: true,
      message: "COD payment confirmed successfully.",
      order: formatOrderResponse(order, "cod"),
    });
  } catch (error) {
    console.error("Error confirming COD payment:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const refundKhaltiPayment = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const orderId = req.params.orderId;
    const { amount, reason } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Refund amount is required.",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Refund reason is required.",
      });
    }

    const refundResult = await paymentService.refundKhaltiPayment(
      orderId,
      loggedInUser,
      amount,
      reason
    );

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully.",
      refundResult: formatPaymentResponse(refundResult, "refund"),
    });
  } catch (error) {
    console.error("Error processing refund:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export default {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  confirmCODPayment,
  refundKhaltiPayment,
};
