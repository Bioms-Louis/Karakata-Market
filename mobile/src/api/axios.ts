import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.187.204:5000/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(async (config) => {
    console.log('🚀 REQUEST:', config.baseURL + config.url);

    try {
        const token = await AsyncStorage.getItem('accessToken');

        if (!config.headers) config.headers = {};

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        console.log('⚠️ AsyncStorage error:', err);
    }

    return config;
});

// Response interceptor
api.interceptors.response.use(
    (res) => {
        console.log('✅ RESPONSE:', res.config.url, res.status);
        return res;
    },
    async (error) => {
        console.log('❌ ERROR:', error?.response?.data || error.message);

        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('accessToken');
        }

        return Promise.reject(error);
    }
);

export default api;