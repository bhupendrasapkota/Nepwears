import productService from "../services/productService.js";

//Formatter
import {
  formatAllProductResponse,
  formatProductDetailResponse,
} from "../helpers/dataFormatter.js";

const createProduct = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const files = req.files;
    const body = req.body;

    // Validate product images
    if (!files.imageUrls || files.imageUrls.length < 2) {
      // Validate main product images
      return res.status(400).json({
        success: false,
        message: "At least two product images are required.",
      });
    }

    // Validate size chart image
    if (!files.sizeChartImageUrl) {
      // Validate size chart image
      return res.status(400).json({
        success: false,
        message: "Size chart image is required.",
      });
    }

    // Validate variant images
    if (!files.variantImageUrls || files.variantImageUrls.length < 2) {
      // Validate variant images
      return res.status(400).json({
        success: false,
        message: "At least two variant images are required.",
      });
    }

    // Required fields validation
    const requiredFields = [
      "name",
      "brand",
      "descriptions",
      "specifications",
      "sku",
      "size",
      "color",
      "price",
      "stock",
    ];
    // Check if all required fields are present in the request body
    for (const field of requiredFields) {
      if (!body[field]) {
        return res
          .status(400)
          .json({ success: false, message: `Missing field: ${field}` });
      }
    }

    // Create product via service
    const product = await productService.createProductWithOneVariant(
      loggedInUser,
      body,
      files
    );

    return res.status(201).json({
      success: true,
      message: "Product with one variant created successfully.",
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getAllProduct = async (req, res) => {
  try {
    const { products, totalCount, currentPage } =
      await productService.getAllProduct(req.query);

    const formattedProducts = products.map(formatAllProductResponse);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully.",
      products: formattedProducts,
      totalCount,
      currentPage,
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantId } = req.query;

    const data = await productService.getProductDetail(id, variantId);

    const formattedData = formatProductDetailResponse(data);

    return res.status(200).json({
      success: true,
      message: "Product detail fetched successfully.",
      product: formattedData,
    });
  } catch (error) {
    console.error("Error fetching product detail:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    const body = req.body;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    // Update product via service
    const updatedProduct = await productService.updateProduct(id, body, files);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    // Delete product via service
    const result = await productService.deleteProduct(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting product:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export default {
  createProduct,
  getAllProduct,
  getProductDetail,
  updateProduct,
  deleteProduct,
};
