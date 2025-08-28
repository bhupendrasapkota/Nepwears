import mongoose from "mongoose";

export const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    brand: { type: String, required: true, trim: true, lowercase: true },

    descriptions: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Description must contain at least one entry.",
      },
    },

    specifications: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Specification must contain at least one entry.",
      },
    },

    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
      distribution: {
        1: { type: Number, default: 0, min: 0 },
        2: { type: Number, default: 0, min: 0 },
        3: { type: Number, default: 0, min: 0 },
        4: { type: Number, default: 0, min: 0 },
        5: { type: Number, default: 0, min: 0 },
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

    sizeChartImageUrl: {
      type: String,
      validate: {
        validator: function (value) {
          return (
            !value || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/.test(value)
          );
        },
        message: "Invalid size chart image URL.",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index on name + brand
productSchema.index({ name: 1, brand: 1 }, { unique: true });

productSchema.virtual("variants", {
  ref: "Variant",
  localField: "_id",
  foreignField: "productId",
  count: true,
});

productSchema.virtual("totalVariants").get(function () {
  return this.variants ? this.variants.length : 0;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
