const reviewService = require('./reviews.service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const createReview = catchAsync(async (req, res, next) => {
  const { productId, orderId, rating, title, body } = req.body;

  if (!productId || !rating) {
    return next(new AppError('Product ID and rating are required.', 400));
  }

  if (rating < 1 || rating > 5) {
    return next(new AppError('Rating must be between 1 and 5.', 400));
  }

  const review = await reviewService.createReview(req.user.id, {
    productId, orderId, rating, title, body
  });

  sendSuccess(res, 201, 'Review submitted successfully.', { review });
});

const getProductReviews = catchAsync(async (req, res) => {
  const result = await reviewService.getProductReviews(
    req.params.productId,
    req.query
  );
  sendSuccess(res, 200, 'Reviews fetched successfully.', result);
});

module.exports = { createReview, getProductReviews };