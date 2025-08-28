import { v2 as cloudinary } from "cloudinary";
import sanitizeFolderName from "../helpers/sanitizeName.js";

// Define the main folder in Cloudinary where all images will be stored
const CLOUDINARY_FOLDER = "Nepwears_E_Commerce";

const buildCloudinarySubfolder = ({
  productName,
  folderType,
  variantSKU,
  collectionName,
}) => {
  if (collectionName) {
    const sanitizedCollectionName = sanitizeFolderName(collectionName);
    return `collections/${sanitizedCollectionName}`;
  }

  const sanitizedProductName = sanitizeFolderName(productName);
  const sanitizedFolderType = sanitizeFolderName(folderType);

  let folder = `products/${sanitizedProductName}/${sanitizedFolderType}`;

  if (sanitizedFolderType === "variants" && variantSKU) {
    const sanitizedVariantSKU = sanitizeFolderName(variantSKU);
    folder += `/${sanitizedVariantSKU}`;
  }

  return folder;
};

/**
 * Uploads multiple images to Cloudinary under a specified subfolder.
 */
export const uploadImage = async (filePath, subfolder) => {
  const folderData = buildCloudinarySubfolder(subfolder);

  // Array to store the results of uploaded images
  const uploadedImage = [];

  // Loop through each file and upload it to Cloudinary
  for (const file of filePath) {
    // Wrap the upload_stream in a Promise so we can use async/await
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            // Set the full path in Cloudinary (main folder + subfolder)
            folder: `${CLOUDINARY_FOLDER}/${folderData}`,
          },
          (error, data) => {
            if (error) return reject(error); // Handle upload error
            resolve(data); // Resolve with upload result
          }
        )
        .end(file.buffer); // Send the file buffer to Cloudinary
    });

    // Push the result to the uploadedImage array
    uploadedImage.push(result);
  }

  // Return all uploaded image information
  return uploadedImage;
};

export const deleteImages = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    return result;
  } catch (err) {
    console.error("Error deleting image from Cloudinary:", err);
    throw new Error("Failed to delete image from Cloudinary");
  }
};
