import {JSX, useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useAuthStore from '../src/store/authStore';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry:                1,
            staleTime:            1000 * 60 * 5,
            refetchOnWindowFocus: false,
        },
    },
});

export default function RootLayout(): JSX.Element {
    const init = useAuthStore((s) => s.init);

    useEffect(() => {
        void init();
    }, [init]);

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="auth/login" />
                    <Stack.Screen name="auth/register" />
                    <Stack.Screen name="product/[slug]" />
                    <Stack.Screen name="checkout" />
                    <Stack.Screen name="order/[id]" />
                    <Stack.Screen name="wishlist" />
                </Stack>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}
