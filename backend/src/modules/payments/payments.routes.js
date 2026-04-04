const express = require('express');
const router = express.Router();
const paymentController = require('./payments.controller');
const { protect } = require('../../middleware/auth');

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

router.post('/initialize', protect, paymentController.initializePayment);
router.get('/verify/:reference', protect, paymentController.verifyPayment);

module.exports = router;