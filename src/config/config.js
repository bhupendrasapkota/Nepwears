import dotenv from "dotenv";

dotenv.config();

const config = {
  apiKey: process.env.API_KEY,
  appUrl: process.env.APP_URL,
  jwtExpiration: process.env.JWT_EXPIRATION,
  jwtSecret: process.env.JWT_SECRET,
  khaltiBaseUrl: process.env.KHALTI_BASE_URL,
  khaltiPublicKey: process.env.KHALTI_PUBLIC_KEY,
  khaltiSecretKey: process.env.KHALTI_SECRET_KEY,
  khaltiWebhookSecret: process.env.KHALTI_WEBHOOK_SECRET,
  mongoDBUrl: process.env.MONGODB_URL,
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  taxRate: process.env.TAX_RATE,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
};

export default config;
