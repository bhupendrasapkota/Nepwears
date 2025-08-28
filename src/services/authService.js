import User from "../models/User.js";
import ResetPassword from "../models/ResetPassword.js";
import bcrypt from "bcryptjs";

//Utils
import { sendEmail } from "../utils/emails/email.js";
import sendSMS from "../utils/phone/phone.js";
import {
  welcomeEmail,
  passwordResetEmail,
  passwordResetSuccessEmail,
} from "../utils/emails/index.js";

// Config
import config from "../config/config.js";

// Registration service function
const register = async (data) => {
  const { firstName, lastName, email, phone, password } = data;

  // Throw specific error if email is already in use
  const existingByEmail = await User.findOne({ email });
  if (existingByEmail) {
    throw {
      status: 400,
      message: "User already exists with this email",
    };
  }

  // Throw specific error if phone exists (only if phone is provided)
  if (phone) {
    const existingByPhone = await User.findOne({ phone });
    if (existingByPhone) {
      throw {
        status: 400,
        message: "User already exists with this phone number",
      };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password: hashedPassword,
  });

  await sendEmail(newUser.email, {
    subject: "Welcome to Nepwears",
    body: welcomeEmail(newUser.firstName, newUser.lastName),
  });

  return newUser;
};

// Authentication service functions
const login = async (data) => {
  // Destructure email, phone, and password from data
  const { email, phone, password } = data;
  // Validate input
  const user = await User.findOne(email ? { email } : { phone });

  // If user is not found or password does not match, throw an error
  const ismatch = user ? await bcrypt.compare(password, user.password) : false;
  // If user is not found or password does not match, throw an error

  if (!user || !ismatch) {
    throw {
      status: 401,
      message: "Invalid email/phone or password",
    };
  }

  return user;
};

// Function to handle forgot password
const forgotPassword = async (email, phone) => {
  // Validate input
  const user = await User.findOne(email ? { email } : { phone });
  // If user is not found, throw an error
  if (!user) {
    throw {
      status: 400,
      message: `User not found with this ${email ? "email" : "phone"}`,
    };
  }

  // Clear any existing reset password entries for the user
  await ResetPassword.deleteMany({ userId: user._id });

  // Generate a random OTP code
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));

  // Create a reset password entry with the OTP code and expiration time
  await ResetPassword.create({
    userId: user._id,
    token: otpCode,
  });

  try {
    if (email) {
      // User requested email reset
      await sendEmail(email, {
        subject: "Password Reset OTP",
        body: passwordResetEmail(otpCode, user._id, config.appUrl),
      });
    } else if (phone) {
      // User requested phone reset
      const smsMessage = `Reset Link: ${config.appUrl}/reset-password/${user._id}?token=${otpCode}\nExpires in 10 minutes`;
      await sendSMS(phone, smsMessage);
    }
  } catch (err) {
    await ResetPassword.deleteMany({ userId: user._id });
    throw { status: 500, message: "Failed to send OTP" };
  }

  return {
    message: `OTP sent to your ${email ? "email" : "phone number"}`,
  };
};

// Function to reset password
const resetPassword = async (userId, token, password) => {
  // Validate input
  const resetPasswordEntry = await ResetPassword.findOne({
    userId,
    expiresAt: { $gt: Date.now() },
  });

  // If no reset password entry is found or the token does not match, throw an error
  if (!resetPasswordEntry || resetPasswordEntry.token !== token) {
    // If no reset password entry is found or the token does not match, throw an error
    throw { status: 400, message: "Invalid or expired OTP" };
  }
  // If the OTP has already been used, throw an error
  if (resetPasswordEntry.isUsed) {
    // If the OTP has already been used, throw an error
    throw { status: 400, message: "OTP has already been used" };
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the user's password and mark the OTP as used
  await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
  });

  await ResetPassword.findByIdAndDelete(resetPasswordEntry._id);

  const user = await User.findById(userId);

  if (user.email) {
    // If the user has an email, send a confirmation email
    await sendEmail(user.email, {
      subject: "Password Reset Confirmation",
      body: passwordResetSuccessEmail(user.firstName, user.lastName),
    });
  }

  return { message: "Password reset successful" };
};

export default { register, login, forgotPassword, resetPassword };
