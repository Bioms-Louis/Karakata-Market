import api from './axios';

export const createReview = (data) => api.post('/reviews', data);
export const getProductReviews = (productId, params) =>
  api.get(`/reviews/product/${productId}`, { params });