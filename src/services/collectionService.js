import Collection from "../models/Collection.js";
import productService from "./productService.js";

//Utils
import { uploadImage, deleteImages } from "../utils/file.js";

//Helper
import extractPublicId from "../helpers/extractPublicId.js";

const createCollection = async (loggedInUserId, body, files) => {
  const { title } = body;

  const existingCollection = await Collection.findOne({ title });

  if (existingCollection) {
    const error = new Error("Collection with this title already exists.");
    error.statusCode = 400;
    throw error;
  }

  const uploadedCollectionImage = await uploadImage(files.imageUrl, {
    collectionName: title,
  });

  const collection = await Collection.create({
    title,
    imageUrl: uploadedCollectionImage[0]?.url,
    createdBy: loggedInUserId,
  });

  return collection;
};

const getAllCollections = async () => {
  return await Collection.find().sort({ createdAt: -1 }).limit(10).lean();
};

const getCollectionById = async (id, query = {}) => {
  const collection = await Collection.findById(id).lean();

  if (!collection) {
    const error = new Error("Collection not found.");
    error.statusCode = 404;
    throw error;
  }

  const { products: allProductVariantPairs } =
    await productService.getAllProduct(query);

  const filteredPairs = allProductVariantPairs.filter(({ product }) =>
    collection.productIds.some(
      (productId) => productId.toString() === product._id.toString()
    )
  );

  return {
    ...collection,
    products: filteredPairs,
  };
};

const updateCollection = async (id, body, files) => {
  const collection = await Collection.findById(id);

  if (!collection) {
    const error = new Error("Collection not found.");
    error.statusCode = 404;
    throw error;
  }

  if (body.title && body.title !== collection.title) {
    const titleExists = await Collection.findOne({ title: body.title });

    if (titleExists) {
      const error = new Error(
        "Another collection with this title already exists."
      );

      error.statusCode = 400;
      throw error;
    }

    collection.title = body.title;
  }

  if (files.imageUrl) {
    if (collection.imageUrl) {
      const publicId = extractPublicId(collection.imageUrl);

      await deleteImages([publicId]);
    }

    // Upload new image
    const uploadedImage = await uploadImage(files.imageUrl, {
      collectionName: body.title || collection.title,
    });

    collection.imageUrl = uploadedImage[0]?.url;
  }

  if (body.productIds) {
    let productIds;

    try {
      productIds = JSON.parse(body.productIds);
    } catch (err) {
      productIds = [body.productIds];
    }

    if (Array.isArray(productIds)) {
      collection.productIds = productIds;
    }
  }

  await collection.save();

  return collection;
};

const deleteCollection = async (id) => {
  const collection = await Collection.findById(id);

  if (!collection) {
    const error = new Error("Collection not found.");
    error.statusCode = 404;
    throw error;
  }

  if (collection.imageUrl) {
    const publicId = extractPublicId(collection.imageUrl);

    await deleteImages([publicId]);
  }

  await Collection.deleteOne({ _id: id });

  return { message: "Collection deleted successfully." };
};

export default {
  createCollection,
  getAllCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
};
