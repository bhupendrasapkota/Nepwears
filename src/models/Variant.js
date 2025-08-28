import mongoose from "mongoose";

export const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, unique: true },

    size: {
      type: String,
      enum: ["S", "M", "L", "XL", "XXL", "XXXL"],
      required: true,
    },

    color: { type: String, required: true, trim: true, lowercase: true },

    price: { type: Number, required: true, min: 0 },

    salePrice: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          if (value == null) return true;
          return this.price >= value;
        },
        message: "Sale price must be less than or equal to the original price.",
      },
    },

    imageUrls: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: "At least two image URLs are required.",
      },
    },

    stock: { type: Number, min: 0, default: 0 },

    status: {
      type: String,
      enum: ["active", "inactive", "out_of_stock"],
      default: "active",
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

variantSchema.index({ productId: 1, sku: 1 }, { unique: true });
variantSchema.index({ productId: 1, color: 1, size: 1 }, { unique: true });

variantSchema.virtual("isOnSale").get(function () {
  return this.salePrice != null && this.salePrice < this.price;
});

variantSchema.virtual("discountPercentage").get(function () {
  if (!this.salePrice || this.salePrice >= this.price) return 0;
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

variantSchema.set("toJSON", { virtuals: true });
variantSchema.set("toObject", { virtuals: true });

const Variant = mongoose.model("Variant", variantSchema);

export default Variant;
