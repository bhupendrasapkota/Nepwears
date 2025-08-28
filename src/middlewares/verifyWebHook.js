import config from "../config/config.js";

const verifyWebhook = (req, res, next) => {
  // For Khalti, webhook verification is optional in development (only work in development implementation for now)
  if (config.nodeEnv === "development") {
    return next();
  }

  // In production, verify webhook signature if available (only work in production implementation)
  const secret =
    req.headers["x-webhook-secret"] || req.headers["khalti-signature"];
  if (secret && secret !== config.khaltiWebhookSecret) {
    return res.status(401).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }

  next();
};

export default verifyWebhook;
