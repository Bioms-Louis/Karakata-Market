const express = require('express');
const router = express.Router();
const orderController = require('./orders.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);

// GET /api/v1/orders/shipping-fee
router.get('/shipping-fee', (req, res) => {
  const { shippingFee } = require('./orders.service');
  // getShippingFee is exported from orders.service.js
  const result = require('./orders.service').getShippingFee();
  res.json({ success: true, message: 'Shipping fee fetched.', data: result });
});

router.get('/:id', orderController.getOrder);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;