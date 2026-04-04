const adminService = require('./admin.service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const getDashboard = catchAsync(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, 200, 'Dashboard data fetched.', stats);
});

const getAllVendors = catchAsync(async (req, res) => {
  const result = await adminService.getAllVendors(req.query);
  sendSuccess(res, 200, 'Vendors fetched.', result);
});

const updateVendorStatus = catchAsync(async (req, res, next) => {
  const { status, rejectionReason } = req.body;
  if (!status) return next(new AppError('Status is required.', 400));

  const vendor = await adminService.updateVendorStatus(
    req.params.id, { status, rejectionReason }
  );
  sendSuccess(res, 200, `Vendor ${status} successfully.`, { vendor });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);
  sendSuccess(res, 200, 'Users fetched.', result);
});

const updateUserStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;
  if (isActive === undefined) {
    return next(new AppError('isActive field is required.', 400));
  }

  const user = await adminService.updateUserStatus(req.params.id, { isActive });
  sendSuccess(res, 200, 'User status updated.', { user });
});

const getAllOrders = catchAsync(async (req, res) => {
  const result = await adminService.getAllOrders(req.query);
  sendSuccess(res, 200, 'Orders fetched.', result);
});

const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  if (!status) return next(new AppError('Status is required.', 400));

  const order = await adminService.updateOrderStatus(req.params.id, { status });
  sendSuccess(res, 200, 'Order status updated.', { order });
});

const deleteProduct = catchAsync(async (req, res) => {
  const result = await adminService.adminDeleteProduct(req.params.id);
  sendSuccess(res, 200, result.message);
});

module.exports = {
  getDashboard,
  getAllVendors,
  updateVendorStatus,
  getAllUsers,
  updateUserStatus,
  getAllOrders,
  updateOrderStatus,
  deleteProduct
};