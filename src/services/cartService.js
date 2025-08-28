import Cart from "../models/Cart.js";

const createCart = async (loggedInUser, cartData) => {
  const { items } = cartData;

  if (!items || !Array.isArray(items) || items.length === 0) {
    const error = new Error("Cart items must be a non-empty array.");
    error.statusCode = 400;
    error.name = "InvalidCartItemsError";
    throw error;
  }

  // Find existing cart
  let cart = await Cart.findOne({ userId: loggedInUser });

  if (!cart) {
    // No cart exists → create new with quantity 1 for each
    cart = new Cart({
      userId: loggedInUser,
      items: items.map(({ productId, variantId }) => ({
        productId,
        variantId,
        quantity: 1,
      })),
    });
  } else {
    // Cart exists → update or add
    for (const newItem of items) {
      const index = cart.items.findIndex(
        (item) =>
          item.variantId.toString() === newItem.variantId &&
          item.productId.toString() === newItem.productId
      );

      if (index > -1) {
        cart.items[index].quantity += 1;
      } else {
        cart.items.push({
          productId: newItem.productId,
          variantId: newItem.variantId,
          quantity: 1,
        });
      }
    }
  }

  await cart.save();

  return cart;
};

const getCart = async (loggedInUser) => {
  const cart = await Cart.findOne({ userId: loggedInUser })
    .populate("items.productId")
    .populate("items.variantId");

  return cart;
};

const updateCartItem = async (loggedInUser, itemId, newQuantity) => {
  const cart = await Cart.findOne({ userId: loggedInUser });

  if (!cart) {
    const error = new Error("Cart not found.");
    error.statusCode = 404;
    throw error;
  }

  const item = cart.items.id(itemId);

  if (!item) {
    const error = new Error("Cart item not found.");
    error.statusCode = 404;
    throw error;
  }

  if (newQuantity < 1) {
    // Auto-delete item
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
  } else {
    item.quantity = newQuantity;
  }

  await cart.save();

  return item;
};

const deleteCartItem = async (loggedInUser, itemId) => {
  const cart = await Cart.findOne({ userId: loggedInUser });

  if (!cart) {
    const error = new Error("Cart not found.");
    error.statusCode = 404;
    error.name = "CartNotFoundError";
    throw error;
  }

  const initialLength = cart.items.length;

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

  if (cart.items.length === initialLength) {
    const error = new Error("Cart item not found.");
    error.statusCode = 404;
    error.name = "CartItemNotFoundError";
    throw error;
  }

  await cart.save();

  return { deletedItemId: itemId };
};

const deleteCart = async (loggedInUser) => {
  const cart = await Cart.findOneAndDelete({ userId: loggedInUser });

  if (!cart) {
    const error = new Error("Cart not found.");
    error.statusCode = 404;
    error.name = "CartNotFoundError";
    throw error;
  }

  return { success: true, message: "Cart deleted successfully." };
};

export default {
  createCart,
  getCart,
  updateCartItem,
  deleteCartItem,
  deleteCart,
};
