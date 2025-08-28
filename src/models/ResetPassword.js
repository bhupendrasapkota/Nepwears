import mongoose from "mongoose";

const resetPasswordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 20); // Set default expiration time to 20 minutes from now

      return date;
    },
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});

const model = mongoose.model("ResetPassword", resetPasswordSchema);

export default model;
