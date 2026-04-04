const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;