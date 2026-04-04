const express = require('express');
const router = express.Router();
const reviewController = require('./reviews.controller');
const { protect } = require('../../middleware/auth');

router.get('/product/:productId', reviewController.getProductReviews);

router.post('/', protect, reviewController.createReview);

module.exports = router;