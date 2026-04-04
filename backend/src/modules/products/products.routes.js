const express = require('express');
const router = express.Router();
const productController = require('./products.controller');
const { protect } = require('../../middleware/auth');
const { restrictTo } = require('../../middleware/roleCheck');

const { getAllProducts, getProduct, getProductById, getBrands, createProduct, updateProduct, deleteProduct } = productController;

router.get('/', getAllProducts);
router.get('/brands', getBrands);
router.get('/id/:id', protect, restrictTo('vendor', 'admin'), getProductById);
router.get('/:slug', getProduct);

router.post('/', protect, restrictTo('vendor'), createProduct);
router.patch('/:id', protect, restrictTo('vendor'), updateProduct);
router.delete('/:id', protect, restrictTo('vendor'), deleteProduct);

module.exports = router;