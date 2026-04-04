const userService = require('./users.service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const getAddresses = catchAsync(async (req, res) => {
  const addresses = await userService.getUserAddresses(req.user.id);
  sendSuccess(res, 200, 'Addresses fetched.', { addresses });
});

const addAddress = catchAsync(async (req, res, next) => {
  const { fullName, phone, address, city, state } = req.body;

  if (!fullName || !phone || !address || !city || !state) {
    return next(new AppError('Please provide all required address fields.', 400));
  }

  const newAddress = await userService.addAddress(req.user.id, req.body);
  sendSuccess(res, 201, 'Address added successfully.', { address: newAddress });
});

const setDefaultAddress = catchAsync(async (req, res) => {
  const address = await userService.setDefaultAddress(req.user.id, req.params.id);
  sendSuccess(res, 200, 'Default address updated.', { address });
});

const deleteAddress = catchAsync(async (req, res) => {
  const result = await userService.deleteAddress(req.user.id, req.params.id);
  sendSuccess(res, 200, result.message);
});

module.exports = { getAddresses, addAddress, setDefaultAddress, deleteAddress };