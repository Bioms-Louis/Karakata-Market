import api from './axios';

export const getVendorDashboard      = ()       => api.get('/vendors/dashboard');
export const getVendorOrders         = (params) => api.get('/vendors/orders', { params });
export const updateVendorOrderStatus = (orderId, data) => api.patch(`/vendors/orders/${orderId}/status`, data);
export const getVendorOrderItems      = (orderId)     => api.get(`/vendors/orders/${orderId}/items`);
export const registerVendor          = (data)   => api.post('/vendors/register', data);
export const applyAsVendor           = (data)   => api.post('/vendors/apply', data);
export const getVendorStore          = (id)     => api.get(`/vendors/${id}`);

// Profile
export const getVendorProfile          = ()     => api.get('/vendors/profile');
export const updatePersonalInfo        = (data) => api.patch('/vendors/profile/personal', data);
export const updateStoreInfo           = (data) => api.patch('/vendors/profile/store', data);
export const changePassword            = (data) => api.patch('/vendors/profile/password', data);
export const updateNotificationPrefs   = (data) => api.patch('/vendors/profile/notifications', data);