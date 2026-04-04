const vendorService = require('./vendors.service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const registerVendor = catchAsync(async (req, res, next) => {
  const { storeName, storeDescription, businessEmail, businessPhone, businessAddress } = req.body;

  if (!storeName) {
    return next(new AppError('Store name is required.', 400));
  }

  const vendor = await vendorService.registerVendor(req.user.id, {
    storeName, storeDescription, businessEmail, businessPhone, businessAddress
  });

  sendSuccess(res, 201,
    'Vendor application submitted! Please wait for admin approval.',
    { vendor }
  );
});

const getVendorDashboard = catchAsync(async (req, res) => {
  const dashboard = await vendorService.getVendorDashboard(req.user.id);
  sendSuccess(res, 200, 'Dashboard data fetched successfully.', dashboard);
});

const getVendorProfile = catchAsync(async (req, res) => {
  const vendor = await vendorService.getVendorProfile(req.params.id);
  sendSuccess(res, 200, 'Vendor profile fetched successfully.', { vendor });
});

module.exports = { registerVendor, getVendorDashboard, getVendorProfile };