import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const productUpload = upload.fields([
  { name: "imageUrls", maxCount: 2 },
  { name: "sizeChartImageUrl", maxCount: 1 },
  { name: "variantImageUrls", maxCount: 10 },
]);

const collectionUpload = upload.fields([{ name: "imageUrl", maxCount: 1 }]);

export default { productUpload, collectionUpload };
