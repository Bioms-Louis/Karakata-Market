const categoryService = require('./categories.service');
const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/apiResponse');

const getAllCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  sendSuccess(res, 200, 'Categories fetched successfully.', { categories });
});

const getCategoryBySlug = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess(res, 200, 'Category fetched successfully.', { category });
});

const createCategory = catchAsync(async (req, res) => {
  const { name, description, iconUrl, parentId, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  const category = await categoryService.createCategory({
    name, description, iconUrl, parentId, sortOrder
  });

  sendSuccess(res, 201, 'Category created successfully.', { category });
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, 200, 'Category updated successfully.', { category });
});

module.exports = { getAllCategories, getCategoryBySlug, createCategory, updateCategory };