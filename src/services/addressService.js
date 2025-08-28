import Address from "../models/Address.js";

// Create a new address
const createAddress = async (userId, addressData) => {
  const { isDefault, ...addressFields } = addressData;

  // If this is set as default, unset other default addresses
  if (isDefault) {
    await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
  }

  const newAddress = await Address.create({
    userId,
    ...addressFields,
    isDefault: isDefault || false,
  });

  return newAddress;
};

// Get all addresses for a user
const getUserAddresses = async (userId) => {
  const addresses = await Address.find({ userId, isActive: true }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  return addresses;
};

// Get a specific address by ID
const getAddressById = async (addressId, userId) => {
  const address = await Address.findOne({
    _id: addressId,
    userId,
    isActive: true,
  });

  if (!address) {
    throw {
      status: 404,
      message: "Address not found",
    };
  }

  return address;
};

// Update an address
const updateAddress = async (addressId, userId, updateData) => {
  const { isDefault, ...updateFields } = updateData;

  // If setting as default, unset other default addresses
  if (isDefault) {
    await Address.updateMany(
      { userId, isDefault: true, _id: { $ne: addressId } },
      { isDefault: false }
    );
  }

  // Update the current address
  const updatedAddress = await Address.findOneAndUpdate(
    { _id: addressId, userId, isActive: true },
    { ...updateFields, isDefault: isDefault || false },
    { new: true, runValidators: true }
  );

  if (!updatedAddress) {
    throw {
      status: 404,
      message: "Address not found",
    };
  }

  // If user passed false for isDefault, ensure at least one default exists
  if (isDefault === false) {
    const defaultExists = await Address.exists({
      userId,
      isDefault: true,
      isActive: true,
    });

    if (!defaultExists) {
      // Pick one address randomly to become default
      const randomAddress = await Address.findOne({ userId, isActive: true });
      if (randomAddress) {
        await Address.findByIdAndUpdate(randomAddress._id, {
          isDefault: true,
        });
      }
    }
  }

  return updatedAddress;
};

// Set an address as default
const setDefaultAddress = async (addressId, userId) => {
  // Unset all other default addresses
  await Address.updateMany({ userId, isDefault: true }, { isDefault: false });

  // Set the specified address as default
  const updatedAddress = await Address.findOneAndUpdate(
    { _id: addressId, userId, isActive: true },
    { isDefault: true },
    { new: true }
  );

  if (!updatedAddress) {
    throw {
      status: 404,
      message: "Address not found",
    };
  }

  return updatedAddress;
};

// Delete an address (soft delete)
const deleteAddress = async (addressId, userId) => {
  const address = await Address.findOneAndUpdate(
    { _id: addressId, userId, isActive: true },
    { isActive: false },
    { new: true }
  );

  if (!address) {
    throw {
      status: 404,
      message: "Address not found",
    };
  }

  // If deleted address was default, set another address as default
  if (address.isDefault) {
    const newDefault = await Address.findOne({
      userId,
      isActive: true,
      _id: { $ne: addressId },
    }).sort({ createdAt: -1 });

    if (newDefault) {
      await Address.findByIdAndUpdate(newDefault._id, { isDefault: true });
    }
  }

  return { message: "Address deleted successfully" };
};

export default {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
