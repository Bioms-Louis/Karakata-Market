import { Tabs, Stack } from 'expo-router';

export default function TabsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }} >
        <Tabs>
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="products" />
            <Tabs.Screen name="cart" />
            <Tabs.Screen name="orders" />
            <Tabs.Screen name="profile" />
        </Tabs>
        </Stack>
    );
}