import {
    View, Text, FlatList, TouchableOpacity,
    Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Trash2, ShoppingCart } from 'lucide-react-native';
import { getWishlist, removeFromWishlist, addToCart } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '../src/store/authStore';
import useCartStore from '../src/store/cartStore';
import type { WishlistItem } from '../src/types';
import { JSX } from "react";

export default function WishlistScreen(): JSX.Element {
    const router = useRouter();
    const qc     = useQueryClient();
    const { isAuthenticated } = useAuthStore();
    const incrementCart       = useCartStore((s) => s.increment);

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['wishlist'],
        queryFn:  getWishlist,
        select:   (res) => (res.data.data.items ?? []) as WishlistItem[],
        enabled:  isAuthenticated,
    });

    const removeMutation = useMutation({
        mutationFn: (productId: string) => removeFromWishlist(productId),
        onSuccess:  () => void qc.invalidateQueries({ queryKey: ['wishlist'] }),
    });

    const cartMutation = useMutation({
        mutationFn: (productId: string) => addToCart({ productId, quantity: 1 }),
        onSuccess: () => {
            incrementCart();
            void qc.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.headerTitle}>My Wishlist</Text></View>
                <View style={styles.center}>
                    <Heart size={60} color={Colors.primary} opacity={0.3} />
                    <Text style={styles.emptyTitle}>Sign in to view wishlist</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth/login' as never)}>
                        <Text style={styles.btnText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Wishlist</Text>
                {items.length > 0 && (
                    <Text style={styles.headerCount}>{items.length} items</Text>
                )}
            </View>

            {isLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
            ) : items.length === 0 ? (
                <View style={styles.center}>
                    <Heart size={60} color={Colors.primary} opacity={0.3} />
                    <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
                    <Text style={styles.emptyText}>Save items you love to find them later</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/products' as never)}>
                        <Text style={styles.btnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList<WishlistItem>
                    data={items}
                    keyExtractor={(i) => i.wishlist_id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const hasDiscount = item.discount_price != null &&
                            parseFloat(item.discount_price) < parseFloat(item.base_price);
                        return (
                            <View style={styles.card}>
                                <TouchableOpacity style={{ borderRadius: 10, overflow: 'hidden' }}
                                                  onPress={() => router.push(`/product/${item.product_slug}` as never)}>
                                    {item.product_image
                                        ? <Image source={{ uri: item.product_image }} style={styles.image} />
                                        : <View style={[styles.image, { backgroundColor: '#f5f0fa' }]} />
                                    }
                                </TouchableOpacity>
                                <View style={styles.info}>
                                    {item.vendor_name && (
                                        <Text style={styles.vendor} numberOfLines={1}>{item.vendor_name}</Text>
                                    )}
                                    <TouchableOpacity onPress={() => router.push(`/product/${item.product_slug}` as never)}>
                                        <Text style={styles.name} numberOfLines={2}>{item.product_name}</Text>
                                    </TouchableOpacity>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                        <Text style={styles.price}>
                                            {formatCurrency(hasDiscount ? item.discount_price : item.base_price)}
                                        </Text>
                                        {hasDiscount && (
                                            <Text style={styles.originalPrice}>{formatCurrency(item.base_price)}</Text>
                                        )}
                                    </View>
                                    <View style={styles.actions}>
                                        <TouchableOpacity style={styles.addCartBtn}
                                                          onPress={() => cartMutation.mutate(item.product_id)}
                                                          disabled={cartMutation.isPending}>
                                            <ShoppingCart size={14} color={Colors.primary} />
                                            <Text style={styles.addCartText}>Add to Cart</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.removeBtn}
                                                          onPress={() => removeMutation.mutate(item.product_id)}>
                                            <Trash2 size={16} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: Colors.background },
    header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.primary },
    headerTitle:  { fontSize: 20, fontWeight: '800', color: Colors.white },
    headerCount:  { fontSize: 13, color: Colors.secondary, fontWeight: '600' },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyTitle:   { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 6 },
    emptyText:    { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginBottom: 24 },
    btn:          { backgroundColor: Colors.secondary, paddingHorizontal: 28,
        paddingVertical: 14, borderRadius: 14 },
    btnText:      { color: Colors.primary, fontWeight: '800', fontSize: 15 },
    list:         { padding: 16, gap: 12 },
    card:         { flexDirection: 'row', gap: 12, backgroundColor: Colors.white,
        borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border },
    image:        { width: 90, height: 90 },
    info:         { flex: 1 },
    vendor:       { fontSize: 9, color: Colors.textLight, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 2 },
    name:         { fontSize: 13, fontWeight: '600', color: Colors.text,
        lineHeight: 18, marginBottom: 6 },
    price:        { fontSize: 14, fontWeight: '800', color: Colors.primary },
    originalPrice:{ fontSize: 11, color: Colors.textLight, textDecorationLine: 'line-through' },
    actions:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addCartBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: Colors.secondary, paddingVertical: 8,
        paddingHorizontal: 10, borderRadius: 10 },
    addCartText:  { fontSize: 12, fontWeight: '700', color: Colors.primary },
    removeBtn:    { padding: 8, borderRadius: 10, backgroundColor: '#fee2e2' },
});
