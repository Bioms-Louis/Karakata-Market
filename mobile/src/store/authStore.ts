import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    init: () => Promise<void>;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    init: async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const userStr = await AsyncStorage.getItem('user');

            if (token && userStr) {
                set({
                    token,
                    user: JSON.parse(userStr) as User,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (e) {
            console.error('Auth init error:', e);
            set({ isLoading: false });
        }
    },

    login: async (token: string, user: User) => {
        if (!token || !user) {
            throw new Error('Token or user data is missing');
        }
        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ token, user, isAuthenticated: true, isLoading: false });
    },

    logout: async () => {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false });
    },

    updateUser: (user: User) => {
        void AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },
}));

export default useAuthStore;