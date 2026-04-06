import { Tabs } from 'expo-router';
import { Colors } from "@/constants/colors"
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";

function AnimatedIcon({ name, color, size, focused }: any) {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1.2 : 1,
            useNativeDriver: true,
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
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,

                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.background,

                // ✅ PREMIUM FLOATING STYLE
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 10,
                    left: 20,
                    right: 20,
                    elevation: 7,
                    backgroundColor: Colors.secondary,
                    borderRadius: 25,
                    height: 70,

                    // Shadow (iOS)
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: 5 },
                    shadowRadius: 10,
                },

                tabBarLabelStyle: {
                    fontSize: 12,
                    marginBottom: 5,
                },

                tabBarItemStyle: {
                    paddingVertical: 5,
                },

                // ✅ ICONS WITH ANIMATION
                tabBarIcon: ({ color, size, focused }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'index') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'products') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'cart') {
                        iconName = focused ? 'cart' : 'cart-outline';
                    } else if (route.name === 'orders') {
                        iconName = focused ? 'receipt' : 'receipt-outline';
                    } else if (route.name === 'profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'ellipse';
                    }

                    return (
                        <AnimatedIcon
                            name={iconName}
                            size={size}
                            color={color}
                            focused={focused}
                        />
                    );
                },
            })}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="products" options={{ title: 'Products' }} />
            <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
            <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
    );
}