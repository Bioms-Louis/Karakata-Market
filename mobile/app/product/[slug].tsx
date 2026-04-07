import {
    View, Text, Image, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Heart, Star, Plus, Minus, Store } from 'lucide-react-native';
import {JSX, useState } from 'react';
import { getProduct, addToCart, addToWishlist, removeFromWishlist, checkWishlisted } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '@/src/store/authStore';
import useCartStore from '@/src/store/cartStore';
import type { Product, ProductVariant } from '@/src/types';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen(): JSX.Element | null {
    const { slug }  = useLocalSearchParams<{ slug: string }>();
    const router    = useRouter();
    const qc        = useQueryClient();
    const { isAuthenticated } = useAuthStore();
    const incrementCart       = useCartStore((s) => s.increment);
    const [quantity, setQty]  = useState(1);
    const [selectedVariant, setVariant] = useState<ProductVariant | null>(null);

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', slug],
        queryFn:  () => getProduct(slug!),
        select:   (res) => res.data.data.product as Product,
        enabled:  !!slug,
    });

    const { data: wishlisted = false } = useQuery({
        queryKey: ['wishlist-check', product?.id],
        queryFn:  () => checkWishlisted(product!.id),
        select:   (res) => (res.data?.data?.wishlisted as boolean) ?? false,
        enabled:  isAuthenticated && !!product?.id,
    });

    const cartMutation = useMutation({
        mutationFn: () => addToCart({
            productId: product!.id,
            variantId: selectedVariant?.id ?? null,
            quantity,
        }),
        onSuccess: () => {
            incrementCart();
            void qc.invalidateQueries({ queryKey: ['cart'] });
            Alert.alert('Added to Cart', `${product!.name} added successfully!`);
        },
        onError: (e: any) => Alert.alert('Error', e.response?.data?.message ?? 'Failed to add to cart'),
    });

    const wishlistMutation = useMutation({
        mutationFn: () => wishlisted ? removeFromWishlist(product!.id) : addToWishlist(product!.id),
        onSuccess: () => void qc.invalidateQueries({ queryKey: ['wishlist-check', product!.id] }),
    });

    if (isLoading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </View>
        );
    }

    if (!product) return null;

    const hasDiscount = product.discount_price != null &&
        parseFloat(product.discount_price) < parseFloat(product.base_price);
    const displayPrice = hasDiscount ? product.discount_price! : product.base_price;
    const discountPct  = hasDiscount
        ? Math.round((1 - parseFloat(product.discount_price!) / parseFloat(product.base_price)) * 100)
        : 0;
    const primaryImage = product.images?.[0]?.image_url ?? product.primary_image;

    return (
        <View style={{ flex: 1, backgroundColor: Colors.white }}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ position: 'relative' }}>
                    {primaryImage
                        ? <Image source={{ uri: primaryImage }} style={styles.image} resizeMode="cover" />
                        : <View style={[styles.image, { backgroundColor: '#f5f0fa' }]} />
                    }
                    {hasDiscount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{discountPct}%</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        onPress={() => {
                            if (!isAuthenticated) { router.push('/auth/login' as never); return; }
                            wishlistMutation.mutate();
                        }}
                    >
                        <Heart size={22}
                               color={wishlisted ? Colors.error : '#aaa'}
                               fill={wishlisted ? Colors.error : 'none'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {product.vendor_name && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Store size={14} color={Colors.primary} />
                            <Text style={styles.vendor}>{product.vendor_name}</Text>
                        </View>
                    )}

                    <Text style={styles.name}>{product.name}</Text>

                    {product.review_count > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 }}>
                            {[1,2,3,4,5].map((s) => (
                                <Star key={s} size={14}
                                      fill={s <= Math.round(parseFloat(product.average_rating)) ? '#ffc70e' : 'none'}
                                      color={s <= Math.round(parseFloat(product.average_rating)) ? '#ffc70e' : '#d1d5db'} />
                            ))}
                            <Text style={styles.reviewCount}>({product.review_count})</Text>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
                        {hasDiscount && (
                            <Text style={styles.originalPrice}>{formatCurrency(product.base_price)}</Text>
                        )}
                    </View>

                    {(product.variants?.length ?? 0) > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Select Variant</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {product.variants!.map((v) => (
                                        <TouchableOpacity
                                            key={v.id}
                                            style={[styles.variantChip,
                                                selectedVariant?.id === v.id && styles.variantChipActive]}
                                            onPress={() => setVariant(selectedVariant?.id === v.id ? null : v)}
                                        >
                                            <Text style={[styles.variantChipText,
                                                selectedVariant?.id === v.id && styles.variantChipTextActive]}>
                                                {v.variant_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Quantity</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity style={styles.qtyBtn}
                                              onPress={() => setQty(Math.max(1, quantity - 1))}>
                                <Minus size={16} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{quantity}</Text>
                            <TouchableOpacity style={styles.qtyBtn}
                                              onPress={() => setQty(Math.min(product.stock_quantity, quantity + 1))}>
                                <Plus size={16} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 11, color: Colors.textLight, marginLeft: 4 }}>
                                {product.stock_quantity} in stock
                            </Text>
                        </View>
                    </View>

                    {product.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Description</Text>
                            <Text style={styles.description}>{product.description}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']}
                          style={{ backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border }}>
                <View style={styles.bottomBar}>
                    <View>
                        <Text style={styles.bottomPrice}>{formatCurrency(displayPrice)}</Text>
                        {hasDiscount && (
                            <Text style={styles.bottomOriginal}>{formatCurrency(product.base_price)}</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.addCartBtn, (cartMutation.isPending || product.stock_quantity === 0)
                        && { opacity: 0.5 }]}
                        onPress={() => {
                            if (!isAuthenticated) { router.push('/auth/login' as never); return; }
                            cartMutation.mutate();
                        }}
                        disabled={cartMutation.isPending || product.stock_quantity === 0}
                    >
                        {cartMutation.isPending
                            ? <ActivityIndicator color={Colors.primary} />
                            : <>
                                <ShoppingCart size={18} color={Colors.primary} />
                                <Text style={styles.addCartText}>
                                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    image:            { width, height: width * 0.85 },
    discountBadge:    { position: 'absolute', top: 16, left: 16, backgroundColor: Colors.error,
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    discountText:     { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    wishlistBtn:      { position: 'absolute', top: 16, right: 16,
        backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 10 },
    content:          { padding: 16 },
    vendor:           { fontSize: 12, color: Colors.primary, fontWeight: '600' },
    name:             { fontSize: 18, fontWeight: '800', color: Colors.text,
        lineHeight: 24, marginBottom: 8 },
    reviewCount:      { fontSize: 12, color: Colors.textLight, marginLeft: 4 },
    price:            { fontSize: 22, fontWeight: '900', color: Colors.secondary },
    originalPrice:    { fontSize: 14, color: Colors.textLight, textDecorationLine: 'line-through' },
    section:          { marginBottom: 16 },
    sectionLabel:     { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    variantChip:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 8 },
    variantChipActive:{ borderColor: Colors.primary, backgroundColor: '#f5f0fa' },
    variantChipText:  { fontSize: 13, color: Colors.text },
    variantChipTextActive: { color: Colors.primary, fontWeight: '700' },
    qtyBtn:           { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5,
        borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    qtyText:          { fontSize: 16, fontWeight: '800', color: Colors.text,
        minWidth: 28, textAlign: 'center' },
    description:      { fontSize: 14, color: Colors.textLight, lineHeight: 22 },
    bottomBar:        { flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', padding: 16 },
    bottomPrice:      { fontSize: 20, fontWeight: '900', color: Colors.secondary },
    bottomOriginal:   { fontSize: 12, color: Colors.textLight, textDecorationLine: 'line-through' },
    addCartBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.secondary, borderRadius: 14,
        paddingHorizontal: 24, paddingVertical: 14 },
    addCartText:      { fontSize: 15, fontWeight: '800', color: Colors.primary },
});
