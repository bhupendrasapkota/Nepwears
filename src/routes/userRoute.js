import express from "express";
import userController from "../controllers/userController.js";
import roleBasedAuth from "../middlewares/roleBasedAuth.js";
import { ROLE_USER, ROLE_ADMIN } from "../constants/roles.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  userController.createUser
);

router.get(
  "/",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN]),
  userController.getAllUsers
);

router.get("/:id", authMiddleware, userController.getUserById);

router.patch(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN, ROLE_USER]),
  userController.updateUser
);

router.patch(
  "/:id/password",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN, ROLE_USER]),
  userController.updatePassword
);

router.delete(
  "/:id",
  authMiddleware,
  roleBasedAuth([ROLE_ADMIN, ROLE_USER]),
  userController.deleteUser
);

export default router;
