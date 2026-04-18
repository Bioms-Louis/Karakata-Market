import {
    View, Text, FlatList, TouchableOpacity,
    Image, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react-native';
import { getCart, updateCartItem, removeCartItem, clearCart, getShippingFee } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '../../src/store/authStore';
import useCartStore from '../../src/store/cartStore';
import type { CartItem, Cart } from '../../src/types';
import { JSX } from "react";

export default function CartScreen(): JSX.Element {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore();
    const setCartCount = useCartStore((s) => s.setCount);

    const { data: cartData, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn:  getCart,
        select:   (res) => res.data.data as Cart,
        enabled:  isAuthenticated,
    });

    const { data: shippingFee = 1500 } = useQuery({
        queryKey: ['shipping-fee'],
        queryFn:  getShippingFee,
        select:   (res) => res.data.data.shippingFee as number,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
            updateCartItem(id, { quantity }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => removeCartItem(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    });

    const clearMutation = useMutation({
        mutationFn: clearCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            setCartCount(0);
        },
    });
    // Add this near the top with other hooks
    const setCartCount = useCartStore((s) => s.setCount);

// After fetching cartData
    useEffect(() => {
        if (cartData) {
            const totalItems = cartData?.summary?.totalQuantity ??
                cartData?.items?.length ?? 0;
            setCartCount(totalItems);
        }
    }, [cartData, setCartCount]);

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.headerTitle}>Shopping Cart</Text></View>
                <View style={styles.center}>
                    <ShoppingBag size={60} color={Colors.primary} opacity={0.7} />
                    <Text style={styles.emptyTitle}>Sign in to view your cart</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth/login' as never)}>
                        <Text style={styles.btnText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
            </SafeAreaView>
        );
    }

    const items    = cartData?.items ?? [];
    const subtotal = cartData?.summary?.subtotal ?? 0;
    const total    = subtotal + shippingFee;

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.headerTitle}>Shopping Cart</Text></View>
                <View style={styles.center}>
                    <ShoppingBag size={60} color={Colors.primary} opacity={0.7} />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyText}>Add some products to get started</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/products' as never)}>
                        <Text style={styles.btnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Cart</Text>
                <TouchableOpacity onPress={() =>
                    Alert.alert('Clear Cart', 'Remove all items?', [
                        { text: 'Cancel' },
                        { text: 'Clear', style: 'destructive', onPress: () => clearMutation.mutate() },
                    ])
                }>
                    <Text style={styles.clearBtn}>Clear</Text>
                </TouchableOpacity>
            </View>

            <FlatList<CartItem>
                data={items}
                keyExtractor={(i) => i.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <View style={{ borderRadius: 10, overflow: 'hidden' }}>
                            {item.product_image
                                ? <Image source={{ uri: item.product_image }} style={styles.cartImg} />
                                : <View style={[styles.cartImg, { backgroundColor: '#f5f0fa' }]} />
                            }
                        </View>
                        <View style={styles.cartInfo}>
                            <Text style={styles.cartName} numberOfLines={2}>{item.product_name}</Text>
                            {item.variant_name && (
                                <Text style={styles.cartVariant}>{item.variant_name}</Text>
                            )}
                            <Text style={styles.cartPrice}>
                                {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
                            </Text>
                            <View style={styles.qtyRow}>
                                <TouchableOpacity style={styles.qtyBtn}
                                                  onPress={() => {
                                                      if (item.quantity <= 1) removeMutation.mutate(item.id);
                                                      else updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
                                                  }}>
                                    <Minus size={14} color={Colors.primary} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                <TouchableOpacity style={styles.qtyBtn}
                                                  onPress={() => updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}>
                                    <Plus size={14} color={Colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeMutation.mutate(item.id)}>
                                    <Trash2 size={14} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                ListFooterComponent={
                    <View style={styles.summary}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                Subtotal ({cartData?.summary?.totalQuantity ?? 0} items)
                            </Text>
                            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Shipping</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(shippingFee)}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                        </View>
                        <TouchableOpacity style={styles.checkoutBtn}
                                          onPress={() => router.push('/checkout' as never)}>
                            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                            <ArrowRight size={18} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: Colors.background },
    header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.secondary },
    headerTitle:    { fontSize: 20, fontWeight: '800', color: Colors.primary },
    clearBtn:       { fontSize: 13, color: Colors.secondary, fontWeight: '600' },
    center:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyTitle:     { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 6 },
    emptyText:      { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginBottom: 24 },
    btn:            { backgroundColor: Colors.secondary, paddingHorizontal: 28,
        paddingVertical: 14, borderRadius: 14 },
    btnText:        { color: Colors.primary, fontWeight: '800', fontSize: 15 },
    list:           { padding: 16, gap: 12 },
    cartItem:       { flexDirection: 'row', gap: 12, backgroundColor: Colors.white,
        borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border },
    cartImg:        { width: 80, height: 80 },
    cartInfo:       { flex: 1 },
    cartName:       { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 3, lineHeight: 18 },
    cartVariant:    { fontSize: 11, color: Colors.textLight, marginBottom: 4 },
    cartPrice:      { fontSize: 14, fontWeight: '800', color: Colors.secondary, marginBottom: 8 },
    qtyRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn:         { width: 28, height: 28, borderRadius: 8, borderWidth: 1,
        borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    qtyText:        { fontSize: 14, fontWeight: '700', color: Colors.text,
        minWidth: 24, textAlign: 'center' },
    removeBtn:      { marginLeft: 'auto', padding: 4 },
    summary:        { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 8 },
    summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel:   { fontSize: 13, color: Colors.textLight },
    summaryValue:   { fontSize: 13, fontWeight: '600', color: Colors.text },
    totalRow:       { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
    totalLabel:     { fontSize: 15, fontWeight: '800', color: Colors.text },
    totalValue:     { fontSize: 16, fontWeight: '900', color: Colors.secondary },
    checkoutBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: Colors.secondary, borderRadius: 14,
        paddingVertical: 16, marginTop: 16 },
    checkoutBtnText:{ fontSize: 15, fontWeight: '800', color: Colors.primary },
});
