import {
    View, Text, Image, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions, Alert, FlatList,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Heart, Star, Plus, Minus, Store, ArrowLeft } from 'lucide-react-native';
import { JSX, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Add this dependency if not present
import { getProduct, addToCart, addToWishlist, removeFromWishlist, checkWishlisted, getVendorProducts, submitReview } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '@/src/store/authStore';
import useCartStore from '@/src/store/cartStore';
import type { Product, ProductVariant, Review } from '@/src/types';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen(): JSX.Element | null {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();
    const qc = useQueryClient();
    const { isAuthenticated } = useAuthStore();
    const incrementCart = useCartStore((s) => s.increment);

    const [quantity, setQty] = useState(1);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

    const scrollRef = useRef<ScrollView>(null);

    // Main product
    const { data: product, isLoading } = useQuery({
        queryKey: ['product', slug],
        queryFn: () => getProduct(slug!),
        select: (res) => res.data.data.product as Product,
        enabled: !!slug,
    });

    // Wishlist status
    const { data: wishlisted = false } = useQuery({
        queryKey: ['wishlist-check', product?.id],
        queryFn: () => checkWishlisted(product!.id),
        select: (res) => (res.data?.data?.wishlisted as boolean) ?? false,
        enabled: isAuthenticated && !!product?.id,
    });

    // Other products from same vendor
    const { data: vendorProducts = [] } = useQuery({
        queryKey: ['vendor-products', product?.vendor_id],
        queryFn: () => getVendorProducts(product!.vendor_id), // Implement this API call
        select: (res) => (res.data.data.products as Product[]).filter(p => p.id !== product?.id),
        enabled: !!product?.vendor_id,
    });

    // Review mutation
    const reviewMutation = useMutation({
        mutationFn: () => submitReview({
            productId: product!.id,
            rating: reviewRating,
            comment: reviewText,
        }),
        onSuccess: () => {
            Alert.alert('Success', 'Review submitted!');
            setReviewText('');
            void qc.invalidateQueries({ queryKey: ['product', slug] });
        },
        onError: (e: any) => Alert.alert('Error', e.response?.data?.message ?? 'Failed to submit review'),
    });

    // Cart mutation (uses selected variants)
    const cartMutation = useMutation({
        mutationFn: () => addToCart({
            productId: product!.id,
            variantId: Object.values(selectedVariants).map(v => v.id), // or handle combined variant if your API expects one ID
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

    // Recently viewed
    useEffect(() => {
        if (!product) return;
        const saveViewed = async () => {
            const viewed = await AsyncStorage.getItem('recentlyViewed');
            let list: Product[] = viewed ? JSON.parse(viewed) : [];
            list = list.filter((p: Product) => p.id !== product.id);
            list.unshift(product);
            list = list.slice(0, 10); // limit to 10
            await AsyncStorage.setItem('recentlyViewed', JSON.stringify(list));
            setRecentlyViewed(list);
        };
        saveViewed();
    }, [product]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </View>
        );
    }
    if (!product) return null;

    const hasDiscount = product.discount_price != null && parseFloat(product.discount_price) < parseFloat(product.base_price);
    const displayPrice = hasDiscount ? product.discount_price! : product.base_price;
    const discountPct = hasDiscount ? Math.round((1 - parseFloat(product.discount_price!) / parseFloat(product.base_price)) * 100) : 0;

    // Group variants by type (e.g., color, size, etc.)
    const variantGroups = product.variants?.reduce((acc: Record<string, ProductVariant[]>, v) => {
        const type = v.variant_type || 'Other'; // Assume your variant has variant_type or derive from variant_name
        if (!acc[type]) acc[type] = [];
        acc[type].push(v);
        return acc;
    }, {}) || {};

    const handleVariantSelect = (type: string, variant: ProductVariant) => {
        setSelectedVariants(prev => ({
            ...prev,
            [type]: variant,
        }));
    };

    // All images (primary + additional)
    const allImages = [
        ...(product.primary_image ? [{ image_url: product.primary_image }] : []),
        ...(product.images || []),
    ].filter(Boolean);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={{ position: 'relative' }}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setCurrentImageIndex(index);
                        }}
                    >
                        {allImages.map((img, index) => (
                            <Image
                                key={index}
                                source={{ uri: img.image_url }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>

                    {/* Dots Indicator */}
                    {allImages.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {allImages.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        { backgroundColor: index === currentImageIndex ? Colors.primary : '#ccc' },
                                    ]}
                                />
                            ))}
                        </View>
                    )}

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
                        <Heart size={22} color={wishlisted ? Colors.error : '#aaa'} fill={wishlisted ? Colors.error : 'none'} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {product.vendor_name && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Store size={14} color={Colors.primary} />
                            <Text style={styles.vendor}>{product.vendor_name}</Text>
                        </View>
                    )}

                    <Text style={styles.name}>{product.name}</Text>

                    {/* Rating */}
                    {product.review_count > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    size={16}
                                    fill={s <= Math.round(parseFloat(product.average_rating || '0')) ? '#ffc70e' : 'none'}
                                    color={s <= Math.round(parseFloat(product.average_rating || '0')) ? '#ffc70e' : '#d1d5db'}
                                />
                            ))}
                            <Text style={styles.reviewCount}>({product.review_count})</Text>
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
                        {hasDiscount && <Text style={styles.originalPrice}>{formatCurrency(product.base_price)}</Text>}
                    </View>

                    {/* Variant Selectors - Grouped */}
                    {Object.keys(variantGroups).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Select Options</Text>
                            {Object.entries(variantGroups).map(([type, variants]) => (
                                <View key={type} style={{ marginBottom: 16 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 8 }}>{type}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            {variants.map((v) => (
                                                <TouchableOpacity
                                                    key={v.id}
                                                    style={[
                                                        styles.variantChip,
                                                        selectedVariants[type]?.id === v.id && styles.variantChipActive,
                                                    ]}
                                                    onPress={() => handleVariantSelect(type, v)}
                                                >
                                                    <Text style={[
                                                        styles.variantChipText,
                                                        selectedVariants[type]?.id === v.id && styles.variantChipTextActive,
                                                    ]}>
                                                        {v.variant_name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Quantity */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Quantity</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, quantity - 1))}>
                                <Minus size={18} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{quantity}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.min(product.stock_quantity, quantity + 1))}>
                                <Plus size={18} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 12, color: Colors.textLight }}>
                                {product.stock_quantity} in stock
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    {product.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Description</Text>
                            <Text style={styles.description}>{product.description}</Text>
                        </View>
                    )}

                    {/* Reviews Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Reviews ({product.review_count || 0})</Text>

                        {/* Add Review */}
                        {isAuthenticated ? (
                            <View style={{ marginBottom: 20, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 12 }}>
                                <Text style={{ marginBottom: 8, fontWeight: '600' }}>Write a review</Text>
                                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                                            <Star size={24} fill={star <= reviewRating ? '#ffc70e' : 'none'} color="#ffc70e" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    style={styles.reviewInput}
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Share your thoughts..."
                                    value={reviewText}
                                    onChangeText={setReviewText}
                                />
                                <TouchableOpacity
                                    style={styles.submitReviewBtn}
                                    onPress={() => reviewMutation.mutate()}
                                    disabled={!reviewText.trim() || reviewMutation.isPending}
                                >
                                    <Text style={{ color: Colors.primary, fontWeight: '700' }}>
                                        {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => router.push('/auth/login' as never)}>
                                <Text style={{ color: Colors.primary }}>Login to write a review</Text>
                            </TouchableOpacity>
                        )}

                        {/* Existing Reviews */}
                        {(product.reviews || []).length > 0 ? (
                            <FlatList
                                data={product.reviews}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }: { item: Review }) => (
                                    <View style={styles.reviewItem}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontWeight: '600' }}>{item.user_name}</Text>
                                            <View style={{ flexDirection: 'row' }}>
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} size={14} fill={s <= item.rating ? '#ffc70e' : 'none'} color="#ffc70e" />
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={{ marginTop: 6, color: Colors.textLight }}>{item.comment}</Text>
                                    </View>
                                )}
                                scrollEnabled={false}
                            />
                        ) : (
                            <Text style={{ color: Colors.textLight, fontStyle: 'italic' }}>No reviews yet. Be the first!</Text>
                        )}
                    </View>

                    {/* Other Products from Vendor */}
                    {vendorProducts.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>More from {product.vendor_name}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {vendorProducts.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.relatedCard}
                                        onPress={() => router.push(`/products/${p.slug}` as never)}
                                    >
                                        <Image source={{ uri: p.primary_image || p.images?.[0]?.image_url }} style={styles.relatedImage} />
                                        <Text style={styles.relatedName} numberOfLines={2}>{p.name}</Text>
                                        <Text style={styles.relatedPrice}>{formatCurrency(p.base_price)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Recently Viewed */}
                    {recentlyViewed.length > 1 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Recently Viewed</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {recentlyViewed.filter(p => p.id !== product.id).map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.relatedCard}
                                        onPress={() => router.push(`/products/${p.slug}` as never)}
                                    >
                                        <Image source={{ uri: p.primary_image || p.images?.[0]?.image_url }} style={styles.relatedImage} />
                                        <Text style={styles.relatedName} numberOfLines={2}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Bar */}
            <View edges={['bottom']} style={{ backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border }}>
                <View style={styles.bottomBar}>
                    <View>
                        <Text style={styles.bottomPrice}>{formatCurrency(displayPrice)}</Text>
                        {hasDiscount && <Text style={styles.bottomOriginal}>{formatCurrency(product.base_price)}</Text>}
                    </View>
                    <TouchableOpacity
                        style={[styles.addCartBtn, (cartMutation.isPending || product.stock_quantity === 0) && { opacity: 0.5 }]}
                        onPress={() => {
                            if (!isAuthenticated) { router.push('/auth/login' as never); return; }
                            cartMutation.mutate();
                        }}
                        disabled={cartMutation.isPending || product.stock_quantity === 0}
                    >
                        {cartMutation.isPending ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <>
                                <ShoppingCart size={18} color={Colors.primary} />
                                <Text style={styles.addCartText}>
                                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    image: { width, height: width * 0.85 },
    dotsContainer: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },

    backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 8 },

    reviewInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    submitReviewBtn: {
        backgroundColor: Colors.secondary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    reviewItem: {
        backgroundColor: '#f9f9f9',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },

    relatedCard: { width: 140, marginRight: 12 },
    relatedImage: { width: 140, height: 140, borderRadius: 12 },
    relatedName: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 4 },
    relatedPrice: { fontSize: 13, color: Colors.secondary, fontWeight: '700' },
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