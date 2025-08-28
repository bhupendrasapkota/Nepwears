import Variant from "../models/Variant.js";
import productService from "./productService.js";

//Utils
import { uploadImage, deleteImages } from "../utils/file.js";

//Helper
import extractPublicId from "../helpers/extractPublicId.js";

// Service to create a new variant for a product
const createVariant = async (
  loggedInUser,
  productId,
  body,
  files,
  options = {}
) => {
  // Destructure the body to get variant details
  const { sku, color, size, price, salePrice = null, stock } = body;

  // Check SKU uniqueness
  const existingSku = await Variant.findOne({ productId, sku });

  // If SKU already exists, throw an error
  if (existingSku) {
    const error = new Error("SKU must be unique. This SKU already exists.");
    error.statusCode = 400;
    throw error;
  }

  // check color and size uniqueness
  const existingVariant = await Variant.findOne({
    productId,
    color,
    size,
  });

  // If a variant with the same color, and size already exists, throw an error
  if (existingVariant) {
    const error = new Error(
      "Variant with this  color, and size already exists."
    );
    error.statusCode = 400;
    throw error;
  }

  //productService is used to get product details for uploading images
  const product = await productService.getProductById(productId);

  // Upload variant images
  const variantFiles = Array.isArray(files.variantImageUrls)
    ? files.variantImageUrls
    : files.variantImageUrls
      ? [files.variantImageUrls]
      : [];

  const uploadedVariantImages = await uploadImage(variantFiles, {
    productName: product.name,
    folderType: "variants",
    variantSKU: sku,
  });

  // Only allow primary variant if the options is set
  const isPrimary = options.allowPrimary === true ? true : false;

  // Variant creation
  const variant = await Variant.create({
    sku,
    size,
    color,
    price,
    salePrice,
    stock,
    isPrimary,
    imageUrls: uploadedVariantImages.map((img) => img.url),
    createdBy: loggedInUser,
    productId,
  });

  return variant;
};

// Service to get all primary variants for a list of products used in productService
const getPrimaryVariantsForProducts = async (products) => {
  const productIds = products.map((product) => product._id);

  return await Variant.find({
    productId: { $in: productIds },
    isPrimary: true,
  }).select("sku size color price salePrice stock status isPrimary productId");
};

// Service to get all variants for a specific product used in productService
const getVariantsByProductId = async (id) => {
  return await Variant.find({ productId: id });
};

// Service to get a variant by its ID
const getVariantById = async (id) => {
  return await Variant.findById(id);
};

// Service to update a variant by its ID
const updateVariant = async (id, body, files) => {
  const { sku, color, size } = body;

  const variant = await Variant.findById(id);

  if (!variant) {
    const error = new Error("Variant not found.");

    error.statusCode = 404;
    throw error;
  }

  // Check SKU uniqueness
  if (sku && sku !== variant.sku) {
    const existingSku = await Variant.findOne({
      productId: variant.productId,
      sku,
    });

    if (existingSku) {
      const error = new Error("SKU must be unique. This SKU already exists.");

      error.statusCode = 400;
      throw error;
    }
  }

  // Check color + size uniqueness
  const isColorChanging = color && color !== variant.color;
  const isSizeChanging = size && size !== variant.size;

  if (isColorChanging || isSizeChanging) {
    const existingVariant = await Variant.findOne({
      productId: variant.productId,
      color: color || variant.color,
      size: size || variant.size,
    });

    if (existingVariant) {
      const error = new Error(
        "Variant with this color and size already exists."
      );

      error.statusCode = 400;
      throw error;
    }
  }

  // Normalize variant image files
  const imageFiles = Array.isArray(files?.variantImageUrls)
    ? files.variantImageUrls
    : files?.variantImageUrls
      ? [files.variantImageUrls]
      : [];

  if (imageFiles.length > 0) {
    for (const imageUrl of variant.imageUrls) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        await deleteImages([publicId]);
      }
    }

    const product = await productService.getProductById(variant.productId);

    const uploadedImages = await uploadImage(imageFiles, {
      productName: product.name,
      folderType: "variants",
      variantSKU: sku || variant.sku,
    });

    variant.imageUrls = uploadedImages.map((img) => img.url);
  }

  // Update fields conditionally
  if (sku) variant.sku = sku;
  if (color) variant.color = color;
  if (size) variant.size = size;

  if ("price" in body) variant.price = body.price;
  if ("salePrice" in body) variant.salePrice = body.salePrice;
  if ("stock" in body) variant.stock = body.stock;
  if ("status" in body) variant.status = body.status;

  return await variant.save();
};

const deleteVariant = async (productId, variantId) => {
  // Check if product exists
  const product = await productService.getProductById(productId);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  // Helper to delete images of a variant
  const deleteVariantImages = async (variant) => {
    for (const imageUrl of variant.imageUrls || []) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) await deleteImages(publicId);
    }
  };

  // If no variantId provided, delete all variants for the product
  if (!variantId) {
    const variants = await Variant.find({ productId: product.id });

    if (!variants.length) {
      const error = new Error("No variants found for this product.");
      error.statusCode = 404;
      throw error;
    }

    for (const variant of variants) {
      await deleteVariantImages(variant);
    }

    await Variant.deleteMany({ productId: product.id });

    return { success: true, message: "All variants deleted successfully." };
  }

  // Prevent deletion if it's the last variant
  const totalVariants = await Variant.countDocuments({ productId: product.id });

  if (totalVariants === 1) {
    const error = new Error("Cannot delete the last remaining variant.");
    error.statusCode = 400;
    throw error;
  }

  // Find the specific variant
  const variant = await Variant.findOne({
    _id: variantId,
    productId: product.id,
  });

  if (!variant) {
    const error = new Error("Variant not found.");
    error.statusCode = 404;
    throw error;
  }

  await deleteVariantImages(variant);
  await Variant.deleteOne({ _id: variantId });

  return { success: true, message: "Variant deleted successfully." };
};

const deleteVariantImage = async (variantId, imageUrl) => {
  const variant = await Variant.findById(variantId);

  if (!variant) {
    const error = new Error("Variant not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!variant.imageUrls.includes(imageUrl)) {
    const error = new Error("Image not found in this variant.");
    error.statusCode = 404;
    throw error;
  }

  const publicId = extractPublicId(imageUrl);
  if (publicId) {
    await deleteImages(publicId);
  }

  variant.imageUrls = variant.imageUrls.filter((url) => url !== imageUrl);

  await variant.save();

  return { message: "Variant image deleted successfully." };
};

export default {
  createVariant,
  getPrimaryVariantsForProducts,
  getVariantsByProductId,
  getVariantById,
  updateVariant,
  deleteVariant,
  deleteVariantImage,
};
