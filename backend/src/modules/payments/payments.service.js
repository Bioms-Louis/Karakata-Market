const axios = require('axios');
const { query, getClient } = require('../../config/database');
const AppError = require('../../utils/AppError');

const paystackAPI = axios.create({
    baseURL: 'https://api.paystack.co',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Read the key at REQUEST time, not at module load time
// This ensures dotenv has already loaded the key
paystackAPI.interceptors.request.use((config) => {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
        throw new Error('PAYSTACK_SECRET_KEY is not set in environment variables.');
    }
    config.headers.Authorization = `Bearer ${key}`;
    return config;
});

// INITIALIZE PAYMENT
const initializePayment = async (userId, orderId) => {
    // 1. Get the order — verify it belongs to this user
    const orderResult = await query(
        `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
        [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
        throw new AppError('Order not found.', 404);
    }

    const order = orderResult.rows[0];

    // 2. Check order isn't already paid
    if (order.payment_status === 'paid') {
        throw new AppError('This order has already been paid for.', 400);
    }

    // 3. Get user email for Paystack
    const userResult = await query(
        'SELECT email, first_name, last_name FROM users WHERE id = $1',
        [userId]
    );

    const user = userResult.rows[0];

    // 4. Call Paystack to initialize the transaction
    const amountInKobo = Math.round(parseFloat(order.total_amount) * 100);

    // Build a safe callback URL — never use '*' or relative paths
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000')
        .replace(/^\*$/, 'http://localhost:3000'); // fallback if FRONTEND_URL=*

    const callbackUrl = process.env.PAYMENT_CALLBACK_URL || `${frontendUrl}/payment/verify`;
    const cancelUrl   = `${frontendUrl}/checkout`;

    let paystackResponse;
    try {
        paystackResponse = await paystackAPI.post('/transaction/initialize', {
            email: user.email,
            amount: amountInKobo,
            reference: order.order_number,
            callback_url: callbackUrl,
            metadata: {
                orderId: order.id,
                orderNumber: order.order_number,
                userId: userId,
                customerName: `${user.first_name} ${user.last_name}`,
                cancel_action: cancelUrl,
            },
        });
    } catch (paystackErr) {
        console.error('Paystack initialization error:', {
            status: paystackErr.response?.status,
            data:   paystackErr.response?.data,
            msg:    paystackErr.message,
        });
        const msg = paystackErr.response?.data?.message || 'Payment gateway error. Please try again.';
        throw new AppError(msg, 400);
    }

    const { authorization_url, reference, access_code } =
        paystackResponse.data.data;

    // 5. Save the Paystack reference to the order
    await query(
        `UPDATE orders
     SET paystack_reference = $1, updated_at = NOW()
     WHERE id = $2`,
        [reference, orderId]
    );

    return {
        authorizationUrl: authorization_url,
        reference,
        accessCode: access_code
    };
};

// VERIFY PAYMENT
const verifyPayment = async (reference) => {
    // 1. Ask Paystack: "Did this payment succeed?"
    let paystackResponse;
    try {
        paystackResponse = await paystackAPI.get(`/transaction/verify/${reference}`);
    } catch (paystackErr) {
        const msg = paystackErr.response?.data?.message || 'Could not reach payment gateway. Please try again.';
        throw new AppError(msg, 400);
    }
    const { status, amount, metadata } = paystackResponse.data.data;

    // 2. Check Paystack confirms it succeeded
    if (status !== 'success') {
        throw new AppError('Payment verification failed. Please try again.', 400);
    }

    // 3. Find the order using the reference
    const orderResult = await query(
        `SELECT * FROM orders WHERE paystack_reference = $1 OR order_number = $1`,
        [reference]
    );

    if (orderResult.rows.length === 0) {
        throw new AppError('Order not found for this payment reference.', 404);
    }

    const order = orderResult.rows[0];

    // 4. Prevent double-processing
    if (order.payment_status === 'paid') {
        return { message: 'Payment already confirmed.', order };
    }

    // 5. Verify amount matches
    const expectedAmountKobo = Math.round(parseFloat(order.total_amount) * 100);

    if (amount !== expectedAmountKobo) {
        throw new AppError('Payment amount mismatch. Please contact support.', 400);
    }

    // 6. Update order to paid
    const updatedOrder = await markOrderAsPaid(order.id, reference);

    return { message: 'Payment verified successfully!', order: updatedOrder };
};

// HANDLE WEBHOOK
const handleWebhook = async (event, signature, rawBody) => {
    // 1. Verify the webhook is genuinely from Paystack
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(rawBody)
        .digest('hex');

    if (signature !== expectedSignature) {
        throw new AppError('Invalid webhook signature.', 401);
    }

    // 2. Handle different event types
    if (event.event === 'charge.success') {
        const { reference, amount, metadata } = event.data;

        // Find the order
        const orderResult = await query(
            `SELECT * FROM orders
             WHERE paystack_reference = $1 OR order_number = $1`,
            [reference]
        );

        if (orderResult.rows.length === 0) return;

        const order = orderResult.rows[0];

        // Skip if already processed
        if (order.payment_status === 'paid') return;

        // Verify amount
        const expectedAmountKobo = Math.round(parseFloat(order.total_amount) * 100);
        if (amount !== expectedAmountKobo) return;

        // Mark as paid
        await markOrderAsPaid(order.id, reference);
    }
};

// HELPER: Mark Order As Paid
const markOrderAsPaid = async (orderId, reference) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        // 1. Update order payment status
        const orderResult = await client.query(
            `UPDATE orders
             SET payment_status = 'paid',
                 status = 'confirmed',
                 paystack_reference = $1,
                 updated_at = NOW()
             WHERE id = $2
                 RETURNING *`,
            [reference, orderId]
        );

        const order = orderResult.rows[0];

        // 2. Notify the customer
        await client.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                order.user_id,
                'Payment Confirmed! 🎉',
                `Your payment for order ${order.order_number} was successful. Your order is being processed.`,
                'payment',
                `/orders/${order.id}`
            ]
        );

        // 3. Notify each vendor whose items are in this order
        const vendorItemsResult = await client.query(
            `SELECT DISTINCT v.user_id, v.store_name, o.order_number
             FROM order_items oi
                      JOIN vendors v ON oi.vendor_id = v.id
                      JOIN orders o ON oi.order_id = o.id
             WHERE oi.order_id = $1`,
            [orderId]
        );

        for (const vendorItem of vendorItemsResult.rows) {
            await client.query(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    vendorItem.user_id,
                    'New Order Received! 🛍️',
                    `You have a new paid order (${vendorItem.order_number}). Please prepare the items for shipping.`,
                    'order',
                    `/vendor/orders`
                ]
            );
        }

        await client.query('COMMIT');
        return order;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    initializePayment,
    verifyPayment,
    handleWebhook
};