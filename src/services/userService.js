import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Constants
import { ROLE_ADMIN } from "../constants/roles.js";

//Utils
import {
  adminUserCreatedEmail,
  passwordUpdatedEmail,
  notifyDeletedAccountEmail,
} from "../utils/emails/index.js";
import { sendEmail } from "../utils/emails/email.js";

// Service function to create a new user
const createUser = async (data) => {
  // Prepare user data object with hashed password and default role
  const userData = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    password: await bcrypt.hash(data.password, 10), // Hash the password before storing
    roles: [ROLE_ADMIN], // Assign default role
  };

  // Define fields that must be unique in the database
  const uniqueFields = [
    { key: "email", message: "User with this email already exists" },
    { key: "phone", message: "User with this phone number already exists" },
  ];

  // Loop through each unique field and check if a user with that value already exists
  for (const { key, message } of uniqueFields) {
    if (data[key]) {
      const existingUser = await User.findOne({ [key]: data[key] });
      if (existingUser) {
        throw new Error(message); // Throw error if duplicate is found
      }
    }
  }

  // Create and return the new user
  const createdUser = await User.create(userData);

  if (createdUser.email) {
    // Send email notification to the new user
    await sendEmail(createdUser.email, {
      subject: "Welcome to Nepwears",
      body: adminUserCreatedEmail(
        createdUser.firstName,
        createdUser.lastName,
        createdUser.email,
        data.password
      ),
    });
  }

  return createdUser;
};

// Service function to get all users with pagination and filtering
const getAllUsers = async ({ page = 1, limit = 10, filters = {} }) => {
  const query = {};

  // Build filter query (case-insensitive partial match)
  if (filters.firstName) {
    query.firstName = { $regex: filters.firstName, $options: "i" };
  }
  if (filters.lastName) {
    query.lastName = { $regex: filters.lastName, $options: "i" };
  }
  if (filters.email) {
    query.email = { $regex: filters.email, $options: "i" };
  }
  if (filters.phone) {
    query.phone = { $regex: filters.phone, $options: "i" };
  }
  if (filters.roles) {
    query.roles = { $regex: filters.roles, $options: "i" };
  }

  const [users, total] = await Promise.all([
    User.find(query).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// Service function to get a user by ID
const getUserById = async (id) => {
  // Fetch user by ID from the database
  const user = await User.findById(id);

  return user;
};

// Service function to update a user
/** Update User  **/
const updateUser = async (id, data) => {
  // Prepare updated user data object
  const updatedUser = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
  };

  // Update and return the user by ID
  // Use 'new: true' to return the updated document
  return await User.findByIdAndUpdate(id, updatedUser, {
    new: true,
  });
};

// Service function to update a user's password
/** Update User Password  **/
const updatePassword = async (id, newPassword, currentPassword) => {
  // Find user by ID
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }

  // Check if the current password matches the stored password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  // Check if the new password is the same as the current password
  if (currentPassword === newPassword) {
    throw new Error("New password cannot be the same as the current password");
  }

  // Hash the new password and update the user's password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  // Send password update email
  await sendEmail(user.email, {
    subject: "Your Password Has Been Updated",
    body: passwordUpdatedEmail(user.firstName, user.lastName, newPassword),
  });

  return { message: "Password updated successfully" };
};

// Service function to delete a user
/** Delete User  **/
const deleteUser = async (id) => {
  // Find user to delete
  const userToDelete = await User.findById(id);
  if (!userToDelete) {
    throw new Error("User not found");
  }

  const isAdmin = userToDelete.roles.includes(ROLE_ADMIN);

  // If user is admin, prevent deletion of last admin
  if (isAdmin) {
    const adminCount = await User.countDocuments({
      roles: ROLE_ADMIN,
      _id: { $ne: id },
    });

    if (adminCount === 0) {
      throw new Error("Cannot delete the last remaining admin.");
    }
  }

  // Delete user
  const deletedUser = await User.findByIdAndDelete(userToDelete._id);

  // Notify user about account deletion
  await sendEmail(deletedUser.email, {
    subject: "Your Nepwears Account Has Been Deleted",
    body: notifyDeletedAccountEmail(userToDelete.firstName),
  });

  return deletedUser;
};

export default {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  deleteUser,
};
