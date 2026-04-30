const express = require('express');
const router  = express.Router();
const { protect }        = require('../../middleware/auth');
const catchAsync         = require('../../utils/catchAsync');
const { sendSuccess }    = require('../../utils/apiResponse');
const {
    initializePayment,
    verifyPayment,
    handleWebhook,
} = require('./payments.service');

// ── POST /api/v1/payments/initialize ─────────────────────────────────────────
// Authenticated — create Paystack transaction for an order
router.post('/initialize', protect, catchAsync(async (req, res, next) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({
            success: false,
            message: 'orderId is required.',
        });
    }

    const result = await initializePayment(req.user.id, orderId);

    sendSuccess(res, 200, 'Payment initialized.', result);
}));

// ── GET /api/v1/payments/verify/:reference ────────────────────────────────────
// Authenticated — verify a payment after redirect back from Paystack
router.get('/verify/:reference', protect, catchAsync(async (req, res) => {
    const result = await verifyPayment(req.params.reference);
    sendSuccess(res, 200, result.message, { order: result.order });
}));

// ── POST /api/v1/payments/webhook ─────────────────────────────────────────────
// Public — Paystack server-to-server webhook (no auth)
// Raw body is parsed in app.js before this route
router.post('/webhook', catchAsync(async (req, res) => {
    const signature = req.headers['x-paystack-signature'];

    await handleWebhook(req.body, signature, req.rawBody);

    // Always return 200 quickly so Paystack doesn't retry
    res.status(200).json({ received: true });
}));

module.exports = router;
