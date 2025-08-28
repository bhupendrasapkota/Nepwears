import collectionService from "../services/collectionService.js";

//Formatter
import {
  formatCategoryResponse,
  formatCollectionResponse,
} from "../helpers/dataFormatter.js";

const createCollection = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const files = req.files;
    const body = req.body;

    if (!body.title) {
      return res.status(400).json({
        success: false,
        message: "Collection title is required.",
      });
    }

    if (!files.imageUrl) {
      // Validate collection image
      return res.status(400).json({
        success: false,
        message: "Collection image is required.",
      });
    }

    const collection = await collectionService.createCollection(
      loggedInUserId,
      body,
      files
    );

    return res.status(201).json({
      success: true,
      message: "Collection created successfully.",
      collection,
    });
  } catch (error) {
    console.error("Error creating collection:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getAllCollections = async (req, res) => {
  try {
    const collections = await collectionService.getAllCollections();

    const formattedCollections = collections.map(formatCategoryResponse);

    return res.status(200).json({
      success: true,
      collections: formattedCollections,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Collection ID is required.",
      });
    }

    const collection = await collectionService.getCollectionById(id, req.query);

    const formattedCollection = formatCollectionResponse(collection);

    return res.status(200).json({
      success: true,
      collection: formattedCollection,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const updateCollection = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const files = req.files;

    const updatedCollection = await collectionService.updateCollection(
      id,
      body,
      files
    );

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully.",
      collection: updatedCollection,
    });
  } catch (error) {
    console.error("Error updating collection:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const deleteCollection = async (req, res) => {
  try {
    const id = req.params.id;

    await collectionService.deleteCollection(id);

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting collection:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export default {
  createCollection,
  getAllCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
};
