import api from './axios';

export const initializePayment = (data) =>
  api.post('/payments/initialize', data);

export const verifyPayment = (reference) =>
  api.get(`/payments/verify/${reference}`);