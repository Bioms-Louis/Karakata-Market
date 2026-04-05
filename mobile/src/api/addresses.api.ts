import api from './axios';

export const getAddresses = () => api.get('/users/addresses');
export const addAddress = (data) => api.post('/users/addresses', data);
export const deleteAddress = (id) => api.delete(`/users/addresses/${id}`);
export const setDefaultAddress = (id) => api.patch(`/users/addresses/${id}/default`);
