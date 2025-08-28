import variantService from "../services/variantService.js";

//Formatter
import { formatVariantResponse } from "../helpers/dataFormatter.js";

const createVariant = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const files = req.files;
    const body = req.body;
    const productId = body.productId;

    // Validate variant images
    if (!files.variantImageUrls || files.variantImageUrls.length < 2) {
      // Validate variant images
      return res.status(400).json({
        success: false,
        message: "At least two variant images are required.",
      });
    }

    // Required fields validation
    const requiredFields = ["sku", "size", "color", "price", "stock"];

    // Check if all required fields are present in the request body
    for (const field of requiredFields) {
      if (!body[field]) {
        return res
          .status(400)
          .json({ success: false, message: `Missing field: ${field}` });
      }
    }
    // Create variant via service
    const variant = await variantService.createVariant(
      loggedInUser,
      productId,
      body,
      files
    );

    return res.status(201).json({
      success: true,
      message: "Variant created successfully.",
      variant,
    });
  } catch (error) {
    console.error("Error creating variant:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getVariantsByProductId = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    // Fetch variants via service
    const variants = await variantService.getVariantsByProductId(id);

    const formattedVariants = variants.map((variant) =>
      formatVariantResponse(variant)
    );

    return res.status(200).json({
      success: true,
      variants: formattedVariants,
    });
  } catch (error) {
    console.error("Error fetching variants:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getVariantById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Variant ID is required." });
    }

    const variant = await variantService.getVariantById(id);

    if (!variant) {
      return res
        .status(404)
        .json({ success: false, message: "Variant not found." });
    }

    const formattedVariant = formatVariantResponse(variant);

    return res.status(200).json({
      success: true,
      variant: formattedVariant,
    });
  } catch (error) {
    console.error("Error fetching variant:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    const body = req.body;

    // Validate variant ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required.",
      });
    }

    // Update variant via service
    const updatedVariant = await variantService.updateVariant(id, body, files);

    return res.status(200).json({
      success: true,
      message: "Variant updated successfully.",
      variant: updatedVariant,
    });
  } catch (error) {
    console.error("Error updating variant:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    // Validate variant ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required.",
      });
    }

    const result = await variantService.deleteVariant(productId, id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting variant:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const deleteVariantImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Image URL is required." });
    }

    const result = await variantService.deleteVariantImage(id, imageUrl);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting variant image:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export default {
  createVariant,
  getVariantsByProductId,
  getVariantById,
  updateVariant,
  deleteVariant,
  deleteVariantImage,
};
