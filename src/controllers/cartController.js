import cartService from "../services/cartService.js";

//Helper
import { formatCartResponse } from "../helpers/dataFormatter.js";

const createCart = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const cartData = req.body;

    if (!cartData.items || cartData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required.",
      });
    }

    const cart = await cartService.createCart(loggedInUser, cartData);

    return res.status(201).json({
      success: true,
      message: "Cart created successfully.",
      cart,
    });
  } catch (error) {
    console.error("Error creating cart:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getCart = async (req, res) => {
  try {
    const loggedInUser = req.user.id;

    const cart = await cartService.getCart(loggedInUser);

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({
        success: true,
        message: "Cart is empty.",
        cart:[],
      });
    }

    const formattedCart = formatCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully.",
      cart: formattedCart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;

    const updatedItem = await cartService.updateCartItem(
      loggedInUser,
      itemId,
      quantity
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully.",
      cart: updatedItem,
    });
  } catch (error) {
    console.error("Error updating cart item:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const loggedInUser = req.user.id;
    const itemId = req.params.id;

    await cartService.deleteCartItem(loggedInUser, itemId);

    return res.status(200).json({
      success: true,
      message: "Cart item deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

const deleteCart = async (req, res) => {
  try {
    const loggedInUser = req.user.id;

    await cartService.deleteCart(loggedInUser);

    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting cart:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong.",
    });
  }
};

export default {
  createCart,
  getCart,
  updateCartItem,
  deleteCartItem,
  deleteCart,
};
