import api from './axios';

export const getAdminDashboard = () =>
  api.get('/admin/dashboard');

export const getAdminUsers = (params) =>
  api.get('/admin/users', { params });
export const createUser = (data) =>
  api.post('/admin/users', data);
export const updateUserStatus = (id, data) =>
  api.patch(`/admin/users/${id}/status`, data);
export const updateUserRole = (id, data) =>
  api.patch(`/admin/users/${id}/role`, data);
export const resetUserPassword = (id, data) =>
  api.patch(`/admin/users/${id}/reset-password`, data);
export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`);

export const getAdminVendors = (params) =>
  api.get('/admin/vendors', { params });
export const getAdminVendor = (id) =>
  api.get(`/admin/vendors/${id}`);
export const updateVendorStatus = (id, data) =>
  api.patch(`/admin/vendors/${id}/status`, data);
export const getAllVendors = () =>
  api.get('/admin/vendors/all');

export const getAdminProducts = (params) =>
  api.get('/admin/products', { params });
export const createAdminProduct = (data) =>
  api.post('/admin/products', data);
export const updateAdminProduct = (id, data) =>
  api.patch(`/admin/products/${id}`, data);
export const deleteAdminProduct = (id) =>
  api.delete(`/admin/products/${id}`);
export const getAdminProductById = (id) =>
  api.get(`/admin/products/${id}`);
export const editAdminProduct = (id, data) =>
  api.put(`/admin/products/${id}`, data);

export const getAdminCategories = () =>
  api.get('/admin/categories');
export const createCategory = (data) =>
  api.post('/admin/categories', data);
export const updateCategory = (id, data) =>
  api.patch(`/admin/categories/${id}`, data);
export const deleteCategory = (id) =>
  api.delete(`/admin/categories/${id}`);

export const getAdminOrders = (params) =>
  api.get('/admin/orders', { params });
export const getAdminOrder = (id) =>
  api.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id, data) =>
  api.patch(`/admin/orders/${id}/status`, data);

export const getAdminReviews = (params) =>
  api.get('/admin/reviews', { params });
export const deleteAdminReview = (id) =>
  api.delete(`/admin/reviews/${id}`);
export const flagReview = (id, data) =>
  api.patch(`/admin/reviews/${id}/flag`, data);

export const getAdminNotifications = (params) =>
  api.get('/admin/notifications', { params });
export const sendNotification = (data) =>
  api.post('/admin/notifications/send', data);
export const deleteAdminNotification = (id) =>
  api.delete(`/admin/notifications/${id}`);
// Carousel
export const getCarousel      = ()       => api.get('/admin/carousel');
export const createSlide      = (data)   => api.post('/admin/carousel', data);
export const updateSlide      = (id, data) => api.patch(`/admin/carousel/${id}`, data);
export const deleteSlide      = (id)     => api.delete(`/admin/carousel/${id}`);
