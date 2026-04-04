const orderService = require('./orders.service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const createOrder = catchAsync(async (req, res, next) => {
  const {
    shippingName, shippingPhone,
    shippingAddress, shippingCity, shippingState
  } = req.body;

  if (!shippingName || !shippingPhone || !shippingAddress ||
      !shippingCity || !shippingState) {
    return next(new AppError(
      'Please provide complete shipping details: name, phone, address, city and state.',
      400
    ));
  }

  const order = await orderService.createOrder(req.user.id, req.body);

  sendSuccess(res, 201, 'Order placed successfully!', { order });
});

const getUserOrders = catchAsync(async (req, res) => {
  const result = await orderService.getUserOrders(req.user.id, req.query);
  sendSuccess(res, 200, 'Orders fetched successfully.', result);
});

const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user.id);
  sendSuccess(res, 200, 'Order fetched successfully.', { order });
});

const cancelOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user.id);
  sendSuccess(res, 200, 'Order cancelled successfully.', { order });
});

module.exports = { createOrder, getUserOrders, getOrder, cancelOrder };