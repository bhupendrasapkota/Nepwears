import express from "express";
import collectionController from "../controllers/collectionController.js";
import authMiddleware from "../middlewares/auth.js";
import { ROLE_ADMIN } from "../constants/roles.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  collectionController.createCollection
);

router.get("/", collectionController.getAllCollections);

router.get("/:id", collectionController.getCollectionById);

router.patch(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  collectionController.updateCollection
);

router.delete(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  collectionController.deleteCollection
);

export default router;
