const express = require('express');
const router = express.Router();
const categoryController = require('./categories.controller');
const { protect } = require('../../middleware/auth');
const { restrictTo } = require('../../middleware/roleCheck');

router.get('/', categoryController.getAllCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

router.post('/', protect, restrictTo('admin'), categoryController.createCategory);
router.patch('/:id', protect, restrictTo('admin'), categoryController.updateCategory);

module.exports = router;