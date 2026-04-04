import api from './axios';

export const getProducts     = (params) => api.get('/products', { params });
export const getProduct      = (slug)   => api.get(`/products/${slug}`);
export const getProductById  = (id)     => api.get(`/products/id/${id}`);
export const createProduct   = (data)   => api.post('/products', data);
export const updateProduct   = (id, data) => api.patch(`/products/${id}`, data);
export const deleteProduct   = (id)     => api.delete(`/products/${id}`);
export const getBrands       = ()        => api.get('/products/brands');

export const getSimilarProducts = async (categoryId, productId) => {
  const res = await api.get(`/products/category/${categoryId}`, {
    params: { exclude: productId }
  });
  return res.data;
};

export const getSellerProducts = async (vendorId, productId) => {
  const res = await api.get(`/products/vendor/${vendorId}`, {
    params: { exclude: productId }
  });
  return res.data;
};