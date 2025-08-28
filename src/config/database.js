import mongoose from "mongoose";
import config from "./config.js";

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (isConnecting) {
    return;
  }
  try {
    isConnecting = true;
    const status = await mongoose.connect(config.mongoDBUrl);

    console.log(`MongoDB connected: ${status.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    // Don't process.exit in serverless; just let invocation fail
    throw error;
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
