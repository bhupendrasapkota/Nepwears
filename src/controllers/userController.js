import userService from "../services/userService.js";

//Helpers
import { formatAuthResponse } from "../helpers/dataFormatter.js";

//Utils
import canAccessUser from "../utils/access.js";

// Controller to create a new user (admin-only access)
const createUser = async (req, res) => {
  try {
    // Destructure fields from the request body
    const { firstName, lastName, email, phone, password, confirmPassword } =
      req.body;

    // Define required fields to validate
    const requiredFields = [
      { field: firstName, name: "First name" },
      { field: lastName, name: "Last name" },
      { field: email, name: "Email" },
      { field: phone, name: "Phone number" },
      { field: password, name: "Password" },
    ];

    // Loop through each field and check if it's missing
    for (const { field, name } of requiredFields) {
      if (!field) {
        return res.status(400).json({ message: `${name} is required` });
      }
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Call service function to create the user
    const user = await userService.createUser(req.body);

    // Format the user data before sending the response
    const formattedUser = formatAuthResponse(user);

    // Send success response with created user
    res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    // Handle errors and send appropriate response
    res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

// Controller to get all users (admin-only access)
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      firstName,
      lastName,
      email,
      phone,
      roles,
    } = req.query;

    const filters = { firstName, lastName, email, phone, roles };

    const { users, total, totalPages } = await userService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
    });

    // Format the user data before sending the response
    const formattedUsers = users.map((user) => formatAuthResponse(user));

    // Send success response with all users
    res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      users: formattedUsers,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    res.status(500).json({
      message: error.message || "Something went wrong.",
    });
  }
};

// Controller to get a user by ID (self or admin access)
const getUserById = async (req, res) => {
  // Extract user ID from request parameters and logged-in user from request
  const { id } = req.params;
  const loggedInUser = req.user;

  if (!canAccessUser(loggedInUser, id)) {
    return res.status(403).json({
      message: `Sorry ${loggedInUser.firstName}, you don't have access.`,
    });
  }

  try {
    // Call service function to get user by ID
    const user = await userService.getUserById(id);

    // If user not found, return not found response
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format the user data before sending the response
    const formattedUser = formatAuthResponse(user);
    // Send success response with user data
    return res.status(200).json({
      success: true,
      message: "User fetched successfully.",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error fetching user by id:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// Controller to update a user (self or admin access)
const updateUser = async (req, res) => {
  const { id } = req.params;
  const loggedInUser = req.user;

  if (!canAccessUser(loggedInUser, id)) {
    return res.status(403).json({
      message: `Sorry ${loggedInUser.firstName}, you don't have access.`,
    });
  }

  try {
    // Call service function to update user
    const updatedUser = await userService.updateUser(id, req.body);

    // If user not found, return not found response
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format the updated user data before sending the response
    const formattedUser = formatAuthResponse(updatedUser);
    // Send success response with updated user data
    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// Controller to update a user's password (self or admin access)
const updatePassword = async (req, res) => {
  // Extract user ID from request parameters and logged-in user from request
  const { id } = req.params;
  const loggedInUser = req.user;

  if (!canAccessUser(loggedInUser, id)) {
    return res.status(403).json({
      message: `Sorry ${loggedInUser.firstName}, you don't have access.`,
    });
  }
  // Extract current password, new password, and confirm password from request body
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate presence of all required fields
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "All password fields are required." });
  }

  // Validate password match
  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "New password and confirm password do not match." });
  }

  // Call service function to update password
  try {
    const updatedUser = await userService.updatePassword(
      id,
      newPassword,
      currentPassword
    );

    // Just in case updatePassword returns null
    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "User not found or password update failed." });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Error updating password:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

// Controller to delete a user (self or admin access)
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const loggedInUser = req.user;

  if (!canAccessUser(loggedInUser, id)) {
    return res.status(403).json({
      message: `Sorry ${loggedInUser.firstName}, you don't have access.`,
    });
  }

  try {
    const deletedUser = await userService.deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`User ${loggedInUser.email} deleted user ${id}`);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

export default {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
};
