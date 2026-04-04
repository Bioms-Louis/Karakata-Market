import api from './axios';

export const getShippingFee  = ()     => api.get('/orders/shipping-fee');
export const createOrder = (data) => api.post('/orders', data);
export const getUserOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);