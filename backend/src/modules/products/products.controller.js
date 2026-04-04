const productService = require('./products.service');
const { query } = require('../../config/database');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const getAllProducts = catchAsync(async (req, res) => {
  const result = await productService.getAllProducts(req.query);
  sendSuccess(res, 200, 'Products fetched successfully.', result);
});

const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  sendSuccess(res, 200, 'Product fetched successfully.', { product });
});

const getBrands = catchAsync(async (req, res) => {
  const brands = await productService.getBrands();
  sendSuccess(res, 200, 'Brands fetched successfully.', { brands });
});

const getProductById = catchAsync(async (req, res, next) => {
  const product = await productService.getProductById(req.params.id);
  // For vendors, verify they own the product
  if (req.user.role === 'vendor') {
    const vendorResult = await query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [req.user.id]
    );
    if (vendorResult.rows.length === 0) {
      return next(new AppError('Vendor account not found.', 403));
    }
    if (product.vendor_id !== vendorResult.rows[0].id) {
      return next(new AppError('Not your product.', 403));
    }
  }
  sendSuccess(res, 200, 'Product fetched successfully.', { product });
});

const createProduct = catchAsync(async (req, res, next) => {
  // Get the vendor record for this user
  const vendorResult = await query(
    'SELECT id, status FROM vendors WHERE user_id = $1',
    [req.user.id]
  );

  if (vendorResult.rows.length === 0) {
    return next(new AppError('You are not registered as a vendor.', 403));
  }

  const vendor = vendorResult.rows[0];

  if (vendor.status !== 'approved') {
    return next(new AppError('Your vendor account must be approved before adding products.', 403));
  }

  if (!req.body.name || !req.body.categoryId || !req.body.basePrice) {
    return next(new AppError('Product name, category and base price are required.', 400));
  }

  const product = await productService.createProduct(vendor.id, req.body);
  sendSuccess(res, 201, 'Product created successfully.', { product });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const vendorResult = await query(
    'SELECT id FROM vendors WHERE user_id = $1',
    [req.user.id]
  );

  if (vendorResult.rows.length === 0) {
    return next(new AppError('Vendor account not found.', 403));
  }

  const product = await productService.updateProduct(
    req.params.id,
    vendorResult.rows[0].id,
    req.body
  );

  sendSuccess(res, 200, 'Product updated successfully.', { product });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const vendorResult = await query(
    'SELECT id FROM vendors WHERE user_id = $1',
    [req.user.id]
  );

  if (vendorResult.rows.length === 0) {
    return next(new AppError('Vendor account not found.', 403));
  }

  const result = await productService.deleteProduct(
    req.params.id,
    vendorResult.rows[0].id
  );

  sendSuccess(res, 200, result.message);
});

module.exports = { getAllProducts, getProduct, getProductById, getBrands, createProduct, updateProduct, deleteProduct };