import Product from "../models/Product.js";
import variantService from "./variantService.js";

//Utils
import { uploadImage, deleteImages } from "../utils/file.js";

//Helper
import extractPublicId from "../helpers/extractPublicId.js";

// Function to create a product with one variant
const createProductWithOneVariant = async (loggedInUser, body, files) => {
  // Destructure the body to get product details
  const { name, brand, descriptions, specifications } = body;

  // Check if a product with the same name and brand already exists
  const existingProduct = await Product.findOne({ name, brand });

  // If it exists, throw an error
  if (existingProduct) {
    const error = new Error("Product with this name and brand already exists.");
    error.statusCode = 400;
    throw error;
  }

  // Upload product images
  const uploadedProductImage = await uploadImage(files.imageUrls, {
    productName: name,
    folderType: "images",
  });

  // Upload size chart image
  const sizeChartImage = await uploadImage(files.sizeChartImageUrl, {
    productName: name,
    folderType: "sizeCharts",
  });

  // Create the product with the uploaded images
  const product = await Product.create({
    name,
    brand,
    descriptions,
    specifications,
    imageUrls: uploadedProductImage.map((img) => img.url),
    sizeChartImageUrl: sizeChartImage[0]?.url,
    createdBy: loggedInUser,
  });

  // Create the first variant for the product
  const variant = await variantService.createVariant(
    loggedInUser,
    product._id,
    body,
    files,
    { allowPrimary: true }
  );

  return {
    product,
    variant,
  };
};

// Function to get a product by its ID for use in variantService
const getProductById = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  return product;
};

// Function to get all products with filtering, sorting, and pagination
const getAllProduct = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  const { name, brand, sort, min, max, stock, size, color, productIds } = query;

  //Build the product query based on the provided filters
  const productQuery = {};
  if (name) productQuery.name = { $regex: name, $options: "i" };
  if (brand) productQuery.brand = { $regex: brand, $options: "i" };
  if (productIds && Array.isArray(productIds) && productIds.length > 0) {
    productQuery._id = { $in: productIds };
  }

  //Fetch matching products
  const products = await Product.find(productQuery)
    .select("name brand ratings imageUrls createdAt")
    .populate("variants")
    .lean({ virtuals: true });

  //Fetch primary variants for the products
  const primaryVariants =
    await variantService.getPrimaryVariantsForProducts(products);

  // Merge products with their primary variants
  const productVariantPairs = primaryVariants
    .map((variant) => {
      const matchedProduct = products.find(
        (product) => product._id.toString() === variant.productId.toString()
      );
      if (!matchedProduct) return null;

      return {
        product: matchedProduct,
        variant,
      };
    })
    .filter(Boolean);

  //Filter the product-variant pairs based on the provided filters
  const filteredPairs = productVariantPairs.filter(({ variant }) => {
    if (min && variant.price < Number(min)) return false;
    if (max && variant.price > Number(max)) return false;
    if (stock === "in" && variant.stock <= 0) return false;
    if (size && variant.size !== size) return false;
    if (color && variant.color !== color) return false;

    return true;
  });

  //Sort the filtered results based on query parameters
  const sortedPairs = [...filteredPairs].sort((a, b) => {
    const nameA = a.product.name;
    const nameB = b.product.name;
    const dateA = new Date(a.product.createdAt);
    const dateB = new Date(b.product.createdAt);
    const priceA = a.variant.price;
    const priceB = b.variant.price;

    if (sort === "az") return nameA.localeCompare(nameB);
    if (sort === "za") return nameB.localeCompare(nameA);
    if (sort === "newest") return dateB - dateA;
    if (sort === "oldest") return dateA - dateB;
    if (sort === "priceLowHigh") return priceA - priceB;
    if (sort === "priceHighLow") return priceB - priceA;

    return 0;
  });

  // Paginate the sorted results
  const totalCount = sortedPairs.length;
  const paginatedPairs = sortedPairs.slice((page - 1) * limit, page * limit);

  return {
    products: paginatedPairs,
    totalCount,
    currentPage: page,
  };
};

// Function to get product details along with its variants
const getProductDetail = async (id, variantId) => {
  const product = await Product.findById(id)
    .select("name brand descriptions specifications ratings")
    .lean();

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const variants = await variantService.getVariantsByProductId(id);

  if (!variants.length) {
    throw createError(404, "No variants found for this product");
  }

  // Pick selected variant if variantId passed, else default to primary
  const selectedVariant =
    variants.find((v) => v._id.toString() === variantId) ||
    variants.find((v) => v.isPrimary) ||
    variants[0];

  return {
    product: { ...product, variants: variants.length },
    variants,
    primaryVariant: selectedVariant,
  };
};

// Function to update a product
const updateProduct = async (id, body, files) => {
  const { name, brand, descriptions, specifications } = body;

  // Find the product
  const product = await Product.findById(id);

  if (!product) {
    const error = new Error("Product not found.");

    error.statusCode = 404;
    throw error;
  }

  // Check for duplicate (if name or brand is being changed)
  if (name || brand) {
    const existingProduct = await Product.findOne({
      name: name || product.name,
      brand: brand || product.brand,
      _id: { $ne: id },
    });

    if (existingProduct) {
      const error = new Error(
        "Product with this name and brand already exists."
      );

      error.statusCode = 400;
      throw error;
    }
  }

  // Normalize file inputs
  const imageFiles = Array.isArray(files?.imageUrls)
    ? files.imageUrls
    : files?.imageUrls
      ? [files.imageUrls]
      : [];

  const sizeChartFiles = Array.isArray(files?.sizeChartImageUrl)
    ? files.sizeChartImageUrl
    : files?.sizeChartImageUrl
      ? [files.sizeChartImageUrl]
      : [];

  // Replace product images if new ones are provided
  if (imageFiles.length > 0) {
    for (const url of product.imageUrls) {
      const oldImagePublicId = extractPublicId(url);
      if (oldImagePublicId) {
        await deleteImages([oldImagePublicId]);
      }
    }

    const uploaded = await uploadImage(imageFiles, {
      productName: name || product.name,
      folderType: "images",
    });

    product.imageUrls = uploaded.map((img) => img.url);
  }

  // Replace size chart image if a new one is provided
  if (sizeChartFiles.length > 0) {
    if (product.sizeChartImageUrl) {
      const oldSizeChartPublicId = extractPublicId(product.sizeChartImageUrl);
      if (oldSizeChartPublicId) {
        await deleteImages([oldSizeChartPublicId]);
      }
    }

    const uploaded = await uploadImage(sizeChartFiles, {
      productName: name || product.name,
      folderType: "sizeCharts",
    });

    product.sizeChartImageUrl = uploaded[0]?.url || null;
  }

  // Conditionally update fields
  if (name) product.name = name;
  if (brand) product.brand = brand;
  if (descriptions) product.descriptions = descriptions;
  if (specifications) product.specifications = specifications;

  return await product.save();
};

// Function to delete a product
const deleteProduct = async (id) => {
  // Find the product by ID
  const product = await Product.findById(id);

  // If product not found, throw an error
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  // Delete product images and size chart image
  for (const imageUrl of product.imageUrls || []) {
    const publicId = extractPublicId(imageUrl);
    if (publicId) await deleteImages(publicId);
  }

  if (product.sizeChartImageUrl) {
    const publicId = extractPublicId(product.sizeChartImageUrl);
    if (publicId) await deleteImages(publicId);
  }

  await variantService.deleteVariant(id);
  await Product.deleteOne({ _id: id });

  return {
    message: "Product deleted successfully.",
  };
};

export default {
  createProductWithOneVariant,
  getProductById,
  getAllProduct,
  getProductDetail,
  updateProduct,
  deleteProduct,
};
