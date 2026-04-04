const cartService = require('./cart.service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  sendSuccess(res, 200, 'Cart fetched successfully.', cart);
});

const addItem = catchAsync(async (req, res, next) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId) {
    return next(new AppError('Product ID is required.', 400));
  }

  if (quantity < 1) {
    return next(new AppError('Quantity must be at least 1.', 400));
  }

  const cart = await cartService.addItemToCart(req.user.id, {
    productId,
    variantId,
    quantity: parseInt(quantity)
  });

  sendSuccess(res, 200, 'Item added to cart.', cart);
});

const updateItem = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(new AppError('Please provide a valid quantity (minimum 1).', 400));
  }

  const cart = await cartService.updateCartItem(
    req.user.id,
    req.params.itemId,
    parseInt(quantity)
  );

  sendSuccess(res, 200, 'Cart item updated.', cart);
});

const removeItem = catchAsync(async (req, res) => {
  const cart = await cartService.removeCartItem(req.user.id, req.params.itemId);
  sendSuccess(res, 200, 'Item removed from cart.', cart);
});

const clearCart = catchAsync(async (req, res) => {
  const result = await cartService.clearCart(req.user.id);
  sendSuccess(res, 200, result.message);
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };