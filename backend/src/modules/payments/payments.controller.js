const paymentService = require('./payments.service');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/apiResponse');

const initializePayment = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;

  if (!orderId) {
    return next(new AppError('Order ID is required.', 400));
  }

  const paymentData = await paymentService.initializePayment(
    req.user.id,
    orderId
  );

  sendSuccess(res, 200, 'Payment initialized.', paymentData);
});

const verifyPayment = catchAsync(async (req, res, next) => {
  const { reference } = req.params;

  if (!reference) {
    return next(new AppError('Payment reference is required.', 400));
  }

  const result = await paymentService.verifyPayment(reference);

  sendSuccess(res, 200, result.message, { order: result.order });
});

const handleWebhook = async (req, res) => {
  res.status(200).send('OK');

  try {
    const signature = req.headers['x-paystack-signature'];
    await paymentService.handleWebhook(
      req.body,
      signature,
      req.rawBody
    );
  } catch (error) {
    console.error('Webhook processing error:', error.message);
  }
};

module.exports = { initializePayment, verifyPayment, handleWebhook };