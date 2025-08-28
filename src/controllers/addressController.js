import addressService from "../services/addressService.js";

// Helper
import { formatAddressResponse } from "../helpers/dataFormatter.js";

// Create a new address
const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;

    // Validate required fields
    const requiredFields = [
      "fullName",
      "phone",
      "streetAddress",
      "city",
      "state",
      "postalCode",
    ];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }

    const newAddress = await addressService.createAddress(userId, addressData);

    const formattedAddress = formatAddressResponse(newAddress);

    res.status(201).json({
      message: "Address created successfully",
      address: formattedAddress,
    });
  } catch (error) {
    console.error("Error creating address:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "You can only have one default address",
      });
    }

    res.status(error.status || 500).json({
      message: error.message || "Something went wrong",
    });
  }
};

// Get all addresses for the current user
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await addressService.getUserAddresses(userId);

    const formattedAddresses = addresses.map(formatAddressResponse);

    res.json({
      addresses: formattedAddresses,
      count: addresses.length,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

// Get a specific address by ID
const getAddressById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await addressService.getAddressById(id, userId);

    const formattedAddress = formatAddressResponse(address);

    res.json({
      address: formattedAddress,
    });
  } catch (error) {
    console.error("Error fetching address:", error);

    res.status(error.status || 500).json({
      message: error.message || "Something went wrong",
    });
  }
};

// Update an address
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    const updatedAddress = await addressService.updateAddress(
      id,
      userId,
      updateData
    );

    const formattedAddress = formatAddressResponse(updatedAddress);

    res.json({
      message: "Address updated successfully",
      address: formattedAddress,
    });
  } catch (error) {
    console.error("Error updating address:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "You can only have one default address",
      });
    }

    res.status(error.status || 500).json({
      message: error.message || "Something went wrong",
    });
  }
};

// Set an address as default
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const updatedAddress = await addressService.setDefaultAddress(id, userId);

    const formattedAddress = formatAddressResponse(updatedAddress);

    res.json({
      message: "Default address updated successfully",
      address: formattedAddress,
    });
  } catch (error) {
    console.error("Error setting default address:", error);

    res.status(error.status || 500).json({
      message: error.message || "Something went wrong",
    });
  }
};

// Delete an address
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await addressService.deleteAddress(id, userId);

    res.json({
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting address:", error);

    res.status(error.status || 500).json({
      message: error.message || "Something went wrong",
    });
  }
};

export default {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
