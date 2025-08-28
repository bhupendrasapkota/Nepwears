import express from "express";
import addressController from "../controllers/addressController.js";
import authMiddleware from "../middlewares/auth.js";
import { ROLE_USER } from "../constants/roles.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  addressController.createAddress
);

router.get(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  addressController.getUserAddresses
);

router.get(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  addressController.getAddressById
);

router.patch(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  addressController.updateAddress
);

router.patch(
  "/:id/default",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  addressController.setDefaultAddress
);

router.delete(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_USER]),
  addressController.deleteAddress
);

export default router;
