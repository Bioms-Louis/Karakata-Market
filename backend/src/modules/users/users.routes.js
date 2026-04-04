const express = require('express');
const router = express.Router();
const userController = require('./users.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);

router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.patch('/addresses/:id/default', userController.setDefaultAddress);
router.delete('/addresses/:id', userController.deleteAddress);

module.exports = router;