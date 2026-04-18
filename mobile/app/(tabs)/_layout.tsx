import { Tabs } from 'expo-router';
import { Colors } from "@/constants/colors";
import { Ionicons } from '@expo/vector-icons';
import { Animated, Platform, View, Text } from 'react-native';
import { useRef, useEffect } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useCartStore from '@/src/store/cartStore';   // ← Import the store

function AnimatedIcon({ name, color, size, focused }: any) {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1.2 : 1,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
        }).start();
    }, [focused]);

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name={name} size={size} color={color} />
        </Animated.View>
    );
}

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const cartCount = useCartStore((state) => state.count);

    const displayCount = cartCount > 99 ? '99+' : cartCount.toString();

    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,

                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.background,

                tabBarStyle: {
                    position: 'absolute',
                    bottom: Math.max(insets.bottom, 8),
                    left: 16,
                    right: 16,
                    elevation: 12,
                    backgroundColor: Colors.secondary,
                    borderRadius: 25,
                    height: 58,
                    paddingBottom: Platform.OS === 'ios' ? 0 : 4,

                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                },

                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginBottom: 4,
                },

                tabBarItemStyle: {
                    paddingTop: 6,
                    paddingBottom: 4,
                },

                // Cart Tab Badge
                ...(route.name === 'cart' && cartCount > 0 && {
                    tabBarBadge: displayCount,
                    tabBarBadgeStyle: {
                        backgroundColor: '#ef4444',   // Red badge
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: '700',
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                    },
                }),

                tabBarIcon: ({ color, size, focused }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    switch (route.name) {
                        case 'index':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'products':
                            iconName = focused ? 'bag' : 'bag-outline';
                            break;
                        case 'cart':
                            iconName = focused ? 'cart' : 'cart-outline';
                            break;
                        case 'orders':
                            iconName = focused ? 'receipt' : 'receipt-outline';
                            break;
                        case 'profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'ellipse';
                    }

                    return <AnimatedIcon name={iconName} size={size} color={color} focused={focused} />;
                },
            })}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="products" options={{ title: 'Shop' }} />
            <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
            <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
    );
}