import api from './axios';

export const getWishlist  = () => api.get('/wishlist');
export const getWishlistCount = () => api.get('/wishlist/count');
export const checkWishlisted = (productId) => api.get(`/wishlist/check/${productId}`);
export const addToWishlist = (productId) => api.post('/wishlist', { product_id: productId });
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);