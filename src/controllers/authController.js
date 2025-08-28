import authService from "../services/authService.js";

//Utils
import { generateToken } from "../utils/jsonWebToken.js";

//Config
import config from "../config/config.js";

//constants
import { PASSWORD_REGEX } from "../constants/regex.js";

//Helpers
import { formatAuthResponse } from "../helpers/dataFormatter.js";

// Controller function for user registration
const register = async (req, res) => {
  try {
    // Destructure first_name, last_name, email, phone, password, and confirmPassword from request body
    const { firstName, lastName, email, phone, password, confirmPassword } =
      req.body;

    // Validate input
    if (!firstName) return res.status(422).send("First name is required.");
    if (!lastName) return res.status(422).send("Name is required.");
    if (!email) return res.status(422).send("Email is required.");
    if (!phone) return res.status(422).send("Phone number is required.");
    if (!password) return res.status(422).send("Password is required.");
    if (!confirmPassword)
      return res.status(422).send("Confirm password is required.");
    // Check if password and confirmPassword match
    if (password != confirmPassword)
      return res.status(422).send("Passwords do not match.");

    // Validate password strength
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain at least one number and one special character",
      });
    }

    // Call the register service to create a new user
    const data = await authService.register(req.body);
    // Format the user data for the response
    const formattedUser = formatAuthResponse(data);

    // Generate a JWT token for the user
    const token = generateToken(formattedUser);

    // Set the token in a cookie
    res.cookie("authToken", token);

    // Return a success response with user data and token
    res.status(201).json({
      user: formattedUser,
      token: token,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

// Controller functions for authentication
const login = async (req, res) => {
  try {
    // Destructure email, phone, and password from request body
    const { email, phone, password } = req.body;

    // Validate input
    if (!email && !phone) {
      // If neither email nor phone is provided, return an error
      return res.status(400).json({
        message: "Email or phone number is required",
      });
    }

    // If password is not provided, return an error
    if (!password) {
      // If password is not provided, return an error
      return res.status(400).json({
        message: "Password is required",
      });
    }

    // Call the login service to authenticate the user
    const data = await authService.login(req.body);
    // Format the user data for the response
    const formattedUser = formatAuthResponse(data);

    // Generate a JWT token for the user
    const token = generateToken(formattedUser);

    // Set the token in a cookie
    res.cookie("token", token);

    // Return a success response with user data and token
    res.json({
      user: formattedUser,
      token: token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    // If an error occurs, return a 500 status with an error message
    res.status(500).json({
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

// Controller function for forgot password
const forgotPassword = async (req, res) => {
  try {
    // Destructure email from request body
    const { email, phone } = req.body;

    // Validate input
    if (!email && !phone) {
      return res.status(400).json({
        message: "Email or phone number is required",
      });
    }

    // Call the forgotPassword service to generate an OTP
    await authService.forgotPassword(email, phone);

    // Return a success response with the OTP
    res.status(200).json({
      success: true,
      message: `OTP sent to your ${email ? "email" : "phone number"}. Please check your ${email ? "inbox" : "SMS"} to reset your password.`,
    });
  } catch (error) {
    console.error("Error during forgot password:", error);
    // If an error occurs, return a 500 status with an error message
    res.status(500).json({
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

// Controller function to reset password
const resetPassword = async (req, res) => {
  // Destructure userId, token, newPassword, and confirmPassword from request body
  try {
    const { userId } = req.params;
    const { token } = req.query;
    const { newPassword, confirmPassword } = req.body;

    // Validate input
    if (!userId || !token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "User ID, token, and new password are required",
      });
    }

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    // Validate password strength
    await authService.resetPassword(userId, token, newPassword);
    // Return a success response indicating password reset was successful
    res.status(200).json({
      message: `Password reset successfully. You can now log in with your new password.`,
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    // If an error occurs, return a 500 status with an error message
    res.status(500).json({
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

const logout = (req, res) => {
  (res.clearCookie("token", {
    httpOnly: true,
    secure: config.nodeEnv,
    sameSite: "Strict",
  }),
    res.json({
      message: "Logout successful",
    }));
};

export default { register, login, forgotPassword, resetPassword, logout };
