import mongoose from "mongoose";
import {
  EMAIL_REGEX,
  PHONE_REGEX,
  PASSWORD_REGEX,
} from "../constants/regex.js";
import { ROLE_USER, ROLE_ADMIN } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => {
          return EMAIL_REGEX.test(value);
        },
        message: "Invalid email address",
      },
    },
    phone: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate: {
        validator: (value) => {
          return PHONE_REGEX.test(value);
        },
        message: "Invalid phone number",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate: {
        validator: (value) => {
          return PASSWORD_REGEX.test(value);
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
    },
    roles: {
      type: [String],
      default: [ROLE_USER],
      enum: [ROLE_USER, ROLE_ADMIN],
    },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
