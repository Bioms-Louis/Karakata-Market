import {
    View, Text, Image, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions, Alert, FlatList, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Heart, Star, Plus, Minus, Store, ArrowLeft } from 'lucide-react-native';
import { JSX, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    getProduct,
    getReviews,
    addToCart,
    addToWishlist,
    removeFromWishlist,
    checkWishlisted,
    getProducts,
    submitReview
} from '@/src/api';

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
    const [selectedAttrValues, setSelectedAttrValues] = useState<Record<string, string>>({});
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

    const imageScrollRef = useRef<ScrollView>(null);

    // Main product
    const { data: product, isLoading } = useQuery({
        queryKey: ['product', slug],
        queryFn: () => getProduct(slug!),
        select: (res) => res.data.data.product as Product,
        enabled: !!slug,
    });

    // Wishlist status (only fetch if authenticated)
    const { data: wishlisted = false } = useQuery({
        queryKey: ['wishlist-check', product?.id],
        queryFn: () => checkWishlisted(product!.id),
        select: (res) => (res.data?.data?.wishlisted as boolean) ?? false,
        enabled: isAuthenticated && !!product?.id,
    });

    // Other products from vendor
    const { data: vendorProducts = [] } = useQuery({
        queryKey: ['vendor-products', product?.vendor_id],
        queryFn: () => getProducts({ vendor: product!.vendor_id, limit: 10 }),
        select: (res) => (res.data.data.products as Product[]).filter(p => p.id !== product?.id),
        enabled: !!product?.vendor_id,
    });

    // Fetch reviews separately (not embedded in product response)
    const { data: reviews = [], refetch: refetchReviews } = useQuery({
        queryKey: ['reviews', product?.id],
        queryFn:  () => getReviews(product!.id),
        select:   (res) => res.data.data.reviews ?? [],
        enabled:  !!product?.id,
    });

    // Review mutation
    const reviewMutation = useMutation({
        mutationFn: () => submitReview({
            productId: product!.id,
            rating: reviewRating,
            comment: reviewText,
        }),
        onSuccess: () => {
            Alert.alert('Thank you!', 'Your review has been submitted.');
            setReviewText('');
            setReviewRating(5);
            void qc.invalidateQueries({ queryKey: ['reviews', product?.id] });
            void qc.invalidateQueries({ queryKey: ['product', slug] });
        },
        onError: (e: any) => Alert.alert('Error', e.response?.data?.message ?? 'Failed to submit review'),
    });

    // Cart mutation
    const cartMutation = useMutation({
        mutationFn: () => addToCart({
            productId: product!.id,
            variantId: selectedVariants['_resolved']?.id ?? null,
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

    // Save to Recently Viewed
    useEffect(() => {
        if (!product) return;
        const saveViewed = async () => {
            try {
                const viewed = await AsyncStorage.getItem('recentlyViewed');
                let list: Product[] = viewed ? JSON.parse(viewed) : [];
                list = list.filter((p: Product) => p.id !== product.id);
                list.unshift(product);
                list = list.slice(0, 10);
                await AsyncStorage.setItem('recentlyViewed', JSON.stringify(list));
                setRecentlyViewed(list);
            } catch (e) {
                console.error('Failed to save recently viewed:', e);
            }
        };
        saveViewed();
    }, [product]);

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </SafeAreaView>
        );
    }

    if (!product) return null;

    const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.base_price);
    const displayPrice = hasDiscount ? product.discount_price! : product.base_price;
    const discountPct = hasDiscount
        ? Math.round((1 - parseFloat(product.discount_price!) / parseFloat(product.base_price)) * 100)
        : 0;

    // ── Variant grouping ─────────────────────────────────────────────────────
    const attrGroups: Record<string, string[]> = {};
    // variantByAttrs: lookup from attr-key + value → variants that contain it
    const variantsByAttr: Record<string, Record<string, ProductVariant[]>> = {};

    product.variants?.forEach((v) => {
        const attrs = (v as any).attributes as Record<string, string> | undefined;
        if (!attrs || Object.keys(attrs).length === 0) {
            // No attributes — fall back to showing variant_name directly
            if (!attrGroups['Option']) attrGroups['Option'] = [];
            if (!variantsByAttr['Option']) variantsByAttr['Option'] = {};
            if (!attrGroups['Option'].includes(v.variant_name)) {
                attrGroups['Option'].push(v.variant_name);
            }
            if (!variantsByAttr['Option'][v.variant_name]) variantsByAttr['Option'][v.variant_name] = [];
            variantsByAttr['Option'][v.variant_name].push(v);
        } else {
            Object.entries(attrs).forEach(([key, val]) => {
                const label = key.charAt(0).toUpperCase() + key.slice(1); // "color" → "Color"
                if (!attrGroups[label]) attrGroups[label] = [];
                if (!variantsByAttr[label]) variantsByAttr[label] = {};
                if (!attrGroups[label].includes(val)) attrGroups[label].push(val);
                if (!variantsByAttr[label][val]) variantsByAttr[label][val] = [];
                variantsByAttr[label][val].push(v);
            });
        }
    });

    const handleAttrSelect = (attrLabel: string, value: string) => {
        // 1. Update the chosen value for this attribute label
        const newAttrValues = { ...selectedAttrValues, [attrLabel]: value };
        setSelectedAttrValues(newAttrValues);

        // 2. Try to find a variant whose attributes satisfy ALL currently chosen values
        const allLabels = Object.keys(attrGroups);
        const allChosen = allLabels.every(label => newAttrValues[label] !== undefined);

        if (allChosen) {
            const matched = product.variants?.find(v => {
                const attrs = (v as any).attributes as Record<string, string> | undefined;
                if (!attrs) return false;
                return allLabels.every(label => {
                    const key = label.toLowerCase();
                    return attrs[key] === newAttrValues[label];
                });
            });
            if (matched) {
                // Store matched variant under a single key for addToCart
                setSelectedVariants({ _resolved: matched });
            }
        } else {
            // Not all attrs chosen yet — clear resolved variant
            setSelectedVariants({});
        }
    };

    // Legacy handler kept for addToCart compat
    const handleVariantSelect = (type: string, variant: ProductVariant) => {
        setSelectedVariants(prev => ({ ...prev, [type]: variant }));
    };

    // All images
    const allImages = [
        ...(product.primary_image ? [{ image_url: product.primary_image }] : []),
        ...(product.images || []),
    ].filter(Boolean) as { image_url: string }[];

    // Protected Action Handler
    const requireAuth = (action: () => void, message: string) => {
        if (!isAuthenticated) {
            Alert.alert(
                "Login Required",
                message,
                [
                    { text: "Cancel" },
                    { text: "Login", onPress: () => router.push('/auth/login' as never) }
                ]
            );
            return false;
        }
        action();
        return true;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top', 'bottom']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={{ position: 'relative' }}>
                    <ScrollView
                        ref={imageScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setCurrentImageIndex(index);
                        }}
                    >
                        {allImages.map((img, i) => (
                            <Image
                                key={i}
                                source={{ uri: img.image_url }}
                                style={styles.mainImage}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>

                    {/* Dots */}
                    {allImages.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {allImages.map((_, i) => (
                                <View
                                    key={i}
                                    style={[styles.dot, { backgroundColor: i === currentImageIndex ? Colors.primary : '#ddd' }]}
                                />
                            ))}
                        </View>
                    )}

                    {hasDiscount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{discountPct}%</Text>
                        </View>
                    )}

                    {/* Wishlist Button - Protected */}
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        onPress={() => requireAuth(() => wishlistMutation.mutate(), "Please login to add to wishlist")}
                    >
                        <Heart
                            size={24}
                            color={wishlisted ? Colors.error : '#999'}
                            fill={wishlisted ? Colors.error : 'none'}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {product.vendor_name && (
                        <View style={styles.vendorRow}>
                            <Store size={16} color={Colors.secondary} />
                            <Text style={styles.vendor}>{product.vendor_name}</Text>
                        </View>
                    )}

                    <Text style={styles.productName}>{product.name}</Text>

                    {/* Rating */}
                    {product.review_count > 0 && (
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                    key={s}
                                    size={16}
                                    fill={s <= Math.round(Number(product.average_rating || 0)) ? '#ffc107' : 'none'}
                                    color="#ffc107"
                                />
                            ))}
                            <Text style={styles.reviewCount}>({product.review_count})</Text>
                        </View>
                    )}

                    <Text style={styles.price}>₦{parseFloat(displayPrice).toLocaleString()}</Text>
                    {hasDiscount && (
                        <Text style={styles.originalPrice}>₦{parseFloat(product.base_price).toLocaleString()}</Text>
                    )}

                    {/* Variants — each attribute key on its own row */}
                    {Object.keys(attrGroups).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Options</Text>
                            {Object.entries(attrGroups).map(([label, values]) => {
                                const selected = selectedAttrValues[label];
                                return (
                                    <View key={label} style={styles.variantGroup}>
                                        {/* Row header: "Color  ·  Red" */}
                                        <View style={styles.variantHeaderRow}>
                                            <Text style={styles.variantType}>{label}</Text>
                                            {selected && (
                                                <Text style={styles.variantSelectedLabel}>
                                                    · {selected}
                                                </Text>
                                            )}
                                        </View>

                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.variantChips}>
                                                {values.map((val) => {
                                                    const isActive = selected === val;

                                                    // For color swatches — detect if val looks like a color
                                                    const looksLikeColor =
                                                        label.toLowerCase() === 'color' ||
                                                        label.toLowerCase() === 'colour';

                                                    // Try to use val as a CSS-style color name
                                                    const knownColors: Record<string, string> = {
                                                        red:'#ef4444', blue:'#3b82f6', green:'#22c55e',
                                                        yellow:'#eab308', black:'#111827', white:'#f9fafb',
                                                        purple:'#a855f7', pink:'#ec4899', orange:'#f97316',
                                                        gray:'#6b7280', grey:'#6b7280', brown:'#92400e',
                                                        navy:'#1e3a5f', beige:'#d4b896', gold:'#fbbf24',
                                                        silver:'#9ca3af', cream:'#fef9c3',
                                                    };
                                                    const swatchColor = looksLikeColor
                                                        ? knownColors[val.toLowerCase()] ?? null
                                                        : null;

                                                    return (
                                                        <TouchableOpacity
                                                            key={val}
                                                            style={[
                                                                styles.variantChip,
                                                                isActive && styles.variantChipActive,
                                                                swatchColor ? styles.variantChipSwatch : null,
                                                            ]}
                                                            onPress={() => handleAttrSelect(label, val)}
                                                            activeOpacity={0.75}
                                                        >
                                                            {swatchColor ? (
                                                                <View style={styles.variantSwatchRow}>
                                                                    <View style={[
                                                                        styles.colorDot,
                                                                        { backgroundColor: swatchColor },
                                                                        isActive && styles.colorDotActive,
                                                                    ]} />
                                                                    <Text style={[
                                                                        styles.variantText,
                                                                        isActive && styles.variantTextActive,
                                                                    ]}>
                                                                        {val}
                                                                    </Text>
                                                                </View>
                                                            ) : (
                                                                <Text style={[
                                                                    styles.variantText,
                                                                    isActive && styles.variantTextActive,
                                                                ]}>
                                                                    {val}
                                                                </Text>
                                                            )}
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </ScrollView>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Quantity */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quantity</Text>
                        <View style={styles.quantityRow}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, quantity - 1))}>
                                <Minus size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{quantity}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.min(product.stock_quantity, quantity + 1))}>
                                <Plus size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.stockText}>{product.stock_quantity} in stock</Text>
                        </View>
                    </View>

                    {/* Description */}
                    {product.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>{product.description}</Text>
                        </View>
                    )}

                    {/* Reviews */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Reviews ({product.review_count || 0})</Text>

                        {isAuthenticated ? (
                            <View style={styles.addReviewBox}>
                                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Write a review</Text>
                                <View style={styles.starsRow}>
                                    {[1,2,3,4,5].map(s => (
                                        <TouchableOpacity key={s} onPress={() => setReviewRating(s)}>
                                            <Star size={28} fill={s <= reviewRating ? '#ffc107' : 'none'} color="#ffc107" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    style={styles.reviewInput}
                                    multiline
                                    placeholder="What did you think about this product?"
                                    value={reviewText}
                                    onChangeText={setReviewText}
                                />
                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={() => reviewMutation.mutate()}
                                    disabled={!reviewText.trim() || reviewMutation.isPending}
                                >
                                    <Text style={styles.submitBtnText}>
                                        {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => router.push('/auth/login' as never)}>
                                <Text style={{ color: Colors.secondary, marginBottom: 10 }}>
                                    Login to add a review
                                </Text>
                            </TouchableOpacity>
                        )}

                        {reviews.length > 0 ? (
                            <FlatList
                                data={reviews}
                                scrollEnabled={false}
                                keyExtractor={(item: any) => item.id?.toString()}
                                renderItem={({ item }: { item: any }) => (
                                    <View style={styles.reviewItem}>
                                        <View style={styles.reviewHeader}>
                                            <View style={styles.reviewerAvatar}>
                                                <Text style={styles.reviewerAvatarText}>
                                                    {(item.first_name ?? item.user_name ?? 'C')?.[0]?.toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.reviewerName}>
                                                    {item.first_name && item.last_name
                                                        ? `${item.first_name} ${item.last_name}`
                                                        : item.first_name ?? item.user_name ?? 'Customer'}
                                                </Text>
                                                <View style={styles.reviewStars}>
                                                    {[1,2,3,4,5].map(s => (
                                                        <Star key={s} size={12}
                                                              fill={s <= item.rating ? '#ffc107' : 'none'}
                                                              color="#ffc107" />
                                                    ))}
                                                    {item.created_at && (
                                                        <Text style={styles.reviewDate}>
                                                            {new Date(item.created_at).toLocaleDateString('en-NG', {
                                                                day: 'numeric', month: 'short', year: 'numeric'
                                                            })}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                        {(item.body || item.comment) && (
                                            <Text style={styles.reviewComment}>
                                                {item.body ?? item.comment}
                                            </Text>
                                        )}
                                    </View>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.reviewDivider} />}
                            />
                        ) : (
                            <Text style={styles.noReviews}>
                                No reviews yet. Be the first to review this product!
                            </Text>
                        )}
                    </View>

                    {/* More from Vendor */}
                    {vendorProducts.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>More from {product.vendor_name}</Text>
                            <Text style={styles.sectionSub}>Other products by this seller</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {vendorProducts.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.relatedCard}
                                        onPress={() => router.push(`/product/${p.slug}` as never)}
                                    >
                                        <Image
                                            source={{ uri: p.primary_image || p.images?.[0]?.image_url }}
                                            style={styles.relatedImage}
                                        />
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
                            <Text style={styles.sectionTitle}>Recently Viewed</Text>
                            <Text style={styles.sectionSub}>Products you've looked at</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {recentlyViewed.filter(p => p.id !== product.id).map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.relatedCard}
                                        onPress={() => router.push(`/product/${p.slug}` as never)}
                                    >
                                        <Image
                                            source={{ uri: p.primary_image || p.images?.[0]?.image_url }}
                                            style={styles.relatedImage}
                                        />
                                        <Text style={styles.relatedName} numberOfLines={2}>{p.name}</Text>
                                        <Text style={styles.relatedPrice}>{formatCurrency(p.base_price)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Add to Cart Bar */}
            <View style={styles.bottomBarContainer}>
                <View style={styles.bottomBar}>
                    <View>
                        <Text style={styles.bottomPrice}>₦{parseFloat(displayPrice).toLocaleString()}</Text>
                        {hasDiscount && <Text style={styles.bottomOriginal}>₦{parseFloat(product.base_price).toLocaleString()}</Text>}
                    </View>

                    <TouchableOpacity
                        style={styles.addToCartBtn}
                        onPress={() => requireAuth(() => cartMutation.mutate(), "Please login to add to cart")}
                        disabled={cartMutation.isPending || product.stock_quantity === 0}
                    >
                        {cartMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <ShoppingCart size={20} color="#ffc70e" />
                                <Text style={styles.addToCartText}>
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
    mainImage: { width, height: width * 0.9 },
    dotsContainer: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },

    discountBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: '#e53935', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
    discountText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    wishlistBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.95)', padding: 10, borderRadius: 30 },
    backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 20 },

    content: { padding: 16 },
    vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    vendor: { color: Colors.secondary, fontWeight: '600' },
    productName: { fontSize: 20, fontWeight: '800', lineHeight: 26, marginBottom: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 12 },
    reviewCount: { marginLeft: 6, color: '#666', fontSize: 14 },
    price: { fontSize: 24, fontWeight: '900', color: Colors.secondary },
    originalPrice: { fontSize: 15, color: '#999', textDecorationLine: 'line-through' },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
    sectionSub: { fontSize: 12, marginBottom: 10},

    variantGroup:        { marginBottom: 20 },
    variantHeaderRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    variantType:         { fontSize: 13, fontWeight: '700', color: Colors.text,
        textTransform: 'uppercase', letterSpacing: 0.6 },
    variantSelectedLabel:{ fontSize: 13, color: Colors.primary, fontWeight: '600' },
    variantChips:        { flexDirection: 'row', gap: 8, paddingBottom: 4 },
    variantChipSwatch:   { paddingHorizontal: 10 },
    variantSwatchRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
    colorDot:            { width: 14, height: 14, borderRadius: 7,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)' },
    colorDotActive:      { borderWidth: 2, borderColor: Colors.primary },
    variantChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#ddd',
    },
    variantChipActive: { borderColor: Colors.primary, backgroundColor: '#f3e8ff' },
    variantText: { fontSize: 14, color: '#333' },
    variantTextActive: { color: Colors.primary, fontWeight: '700' },

    quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    qtyBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    qtyText: { fontSize: 18, fontWeight: '700', minWidth: 30, textAlign: 'center' },
    stockText: { color: '#666', fontSize: 14, marginLeft: 8 },

    description: { fontSize: 15, lineHeight: 23, color: '#444' },

    addReviewBox: { backgroundColor: '#f9f7fb', padding: 16, borderRadius: 14, marginBottom: 20 },
    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    reviewInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, minHeight: 90, textAlignVertical: 'top', marginBottom: 12 },
    submitBtn: { backgroundColor: Colors.secondary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    submitBtnText: { color: Colors.primary, fontWeight: '700' },

    reviewItem:          { backgroundColor: Colors.white, padding: 14, borderRadius: 12,
        borderWidth: 1, borderColor: Colors.border },
    reviewHeader:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    reviewerAvatar:      { width: 34, height: 34, borderRadius: 17,
        backgroundColor: Colors.primary, alignItems: 'center',
        justifyContent: 'center', flexShrink: 0 },
    reviewerAvatarText:  { fontSize: 13, fontWeight: '800', color: Colors.secondary },
    reviewerName:        { fontSize: 13, fontWeight: '700', color: Colors.text },
    reviewStars:         { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    reviewDate:          { fontSize: 10, color: Colors.textLight, marginLeft: 6 },
    reviewComment:       { fontSize: 13, color: Colors.text, lineHeight: 20,
        paddingLeft: 44 },
    reviewDivider:       { height: 10 },
    noReviews:           { fontSize: 13, color: Colors.textLight, textAlign: 'center',
        paddingVertical: 16 },

    relatedCard: { width: 140, marginRight: 12 },
    relatedImage: { width: 140, height: 140, borderRadius: 12 },
    relatedName: { fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 4 },
    relatedPrice: { fontSize: 13, color: Colors.secondary, fontWeight: '700' },

    bottomBarContainer: { backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: '#eee' },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16
    },
    bottomPrice: { fontSize: 22, fontWeight: '900', color: Colors.secondary },
    bottomOriginal: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },

    addToCartBtn: {
        backgroundColor: Colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 12,
    },
    addToCartText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
});