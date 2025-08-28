import mongoose from "mongoose";
import { PHONE_REGEX, POSTAL_CODE_REGEX } from "../constants/regex.js";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (value) => PHONE_REGEX.test(value),
        message: "Invalid phone number",
      },
    },
    streetAddress: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      validate: {
        validator: (value) => POSTAL_CODE_REGEX.test(value),
        message: "Invalid postal code",
      },
    },
    country: {
      type: String,
      default: "Nepal",
      required: true,
    },
    addressType: {
      type: String,
      enum: ["home", "office", "other"],
      default: "home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

// Ensure only one default address per user
addressSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;
