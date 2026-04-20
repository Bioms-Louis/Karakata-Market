import api from './axios';

// ── Auth ──────────────────────────────────────
export const login    = (data: { email: string; password: string }) =>
    api.post('/auth/login', data);

export const register = (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}) => api.post('/auth/register', data);

export const getMe = () => api.get('/auth/me');

// ── Products ──────────────────────────────────
export interface ProductParams {
    page?: number | string;
    limit?: number | string;
    category?: string;
    search?: string;
    featured?: string;
    sortBy?: string;
    sortOrder?: string;
    vendor?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
}

export const getProducts   = (params?: ProductParams) => api.get('/products', { params });
export const getProduct    = (slug: string)           => api.get(`/products/${slug}`);

// ── Categories ────────────────────────────────
export const getCategories = () => api.get('/categories');

// ── Carousel ──────────────────────────────────
export const getCarousel   = () => api.get('/carousel');

// ── Cart ──────────────────────────────────────
export const getCart = () => api.get('/cart');

export const addToCart = (data: {
    productId: string | number;
    variantId?: string | number | null;
    quantity: number;
}) => api.post('/cart/items', data);

export const updateCartItem = (itemId: string | number, data: { quantity: number }) =>
    api.patch(`/cart/items/${itemId}`, data);

export const removeCartItem = (itemId: string | number) =>
    api.delete(`/cart/items/${itemId}`);

export const clearCart = () => api.delete('/cart');

// ── Orders ────────────────────────────────────
export interface OrderPayload {
    shippingName:    string;
    shippingPhone:   string;
    shippingAddress: string;
    shippingCity:    string;
    shippingState:   string;
    shippingCountry?: string;
    notes?:          string | null;
}

export const createOrder    = (data: OrderPayload)        => api.post('/orders', data);
export const getOrders      = (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params });
export const getOrder       = (id: string)                => api.get(`/orders/${id}`);
export const cancelOrder    = (id: string)                => api.patch(`/orders/${id}/cancel`);
export const getShippingFee = ()                          => api.get('/orders/shipping-fee');

// ── Wishlist ──────────────────────────────────
export const getWishlist        = ()              => api.get('/wishlist');
export const addToWishlist      = (id: string)    => api.post('/wishlist', { product_id: id });
export const removeFromWishlist = (id: string)    => api.delete(`/wishlist/${id}`);
export const checkWishlisted    = (id: string)    => api.get(`/wishlist/check/${id}`);

// ── Reviews ───────────────────────────────────
export const getReviews   = (productId: string)   => api.get(`/reviews/product/${productId}`);
export const createReview = (data: {
    productId: string;
    rating: number;
    title?: string;
    body?: string;
})                                                => api.post('/reviews', data);

// Convenience — fetch products by vendor ID
export const getVendorProducts = (vendorId: string) =>
    getProducts({ vendor: vendorId, limit: 10 });

// ── User Profile ──────────────────────────────
export const getMyProfile    = ()                         => api.get('/users/me');
export const updateMyProfile = (data: {
    firstName: string;
    lastName:  string;
    email:     string;
    phone?:    string;
})                                                        => api.patch('/users/me', data);
export const changeMyPassword = (data: {
    currentPassword: string;
    newPassword:     string;
})                                                        => api.patch('/users/me/password', data);
export const getMyAddresses  = ()                         => api.get('/users/me/addresses');

// Alias so [slug].tsx can import submitReview
export const submitReview = createReview;

// ── Payments ──────────────────────────────────
export const initializePayment = (data: { orderId: string }) =>
    api.post('/payments/initialize', data);

export const verifyPayment = (reference: string) =>
    api.get(`/payments/verify/${reference}`);