import api from '../api/axios';

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
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    featured?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    vendor?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
}

export const getProducts = async (params?: ProductParams) => {
    const res = await api.get('/products', { params });
    return res.data;
};

export const getProduct = async (slug: string) => {
    const res = await api.get(`/products/${slug}`);
    return res.data;
};

// ── Carousel ──────────────────────────────────
export const getCarousel = async () => {
    const res = await api.get('/carousel');
    return res.data;
};

// ── Cart ──────────────────────────────────────
export const getCart        = ()                          => api.get('/cart');
export const addToCart      = (data: {
    productId: string;
    variantId?: string | null;
    quantity: number;
})                                                        => api.post('/cart', data);
export const updateCartItem = (id: string, data: { quantity: number }) =>
    api.patch(`/cart/${id}`, data);
export const removeCartItem = (id: string)                => api.delete(`/cart/${id}`);
export const clearCart      = ()                          => api.delete('/cart');

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

export class User {
}

export class Product {
}

export class Category {
}

export class CarouselSlide {
}