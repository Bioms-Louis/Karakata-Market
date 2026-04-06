import {
    View, Text, ScrollView, TouchableOpacity, Image,
    FlatList, StyleSheet, Dimensions, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {useState, useEffect, useRef, useCallback, JSX} from 'react';
import { getProducts, getCategories, getCarousel } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '../../src/store/authStore';
import useCartStore from '../../src/store/cartStore';
import type { Product, Category, CarouselSlide } from '../../src/types';

const { width } = Dimensions.get('window');
const SLIDE_HEIGHT = 220;

// ── Carousel ──────────────────────────────────
interface CarouselProps {
    slides: CarouselSlide[] | undefined;
}

const Carousel = ({ slides }: CarouselProps): JSX.Element => {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const flatRef = useRef<FlatList<CarouselSlide>>(null);
    const items = slides?.length ? slides : [];

    useEffect(() => {
        if (items.length <= 1) return;
        const timer = setInterval(() => {
            const next = (current + 1) % items.length;
            try { flatRef.current?.scrollToIndex({ index: next, animated: true }); } catch {}
            setCurrent(next);
        }, 4000);
        return () => clearInterval(timer);
    }, [current, items.length]);

    if (items.length === 0) {
        return (
            <View style={[styles.carouselContainer, styles.carouselPlaceholder]}>
                <Text style={styles.placeholderTitle}>Welcome to Karakata Market</Text>
                <Text style={styles.placeholderSub}>Your one click shop</Text>
            </View>
        );
    }

    const goTo = (next: number) => {
        try { flatRef.current?.scrollToIndex({ index: next, animated: true }); } catch {}
        setCurrent(next);
    };

    return (
        <View style={styles.carouselContainer}>
            <FlatList<CarouselSlide>
                ref={flatRef}
                data={items}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(s) => s.id}
                onMomentumScrollEnd={(e) =>
                    setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.slide}
                        activeOpacity={0.95}
                        onPress={() => item.link && router.push(item.link as never)}
                    >
                        {item.image_url
                            ? <Image source={{ uri: item.image_url }} style={styles.slideImg} resizeMode="cover" />
                            : <View style={[styles.slideImg, styles.slidePlaceholder]} />
                        }
                        <View style={styles.slideOverlay} />
                        <View style={[
                            styles.slideContent,
                            item.position === 'center' ? styles.slideCenter
                                : item.position === 'right' ? styles.slideRight
                                    : styles.slideLeft,
                        ]}>
                            {item.badge && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{item.badge}</Text>
                                </View>
                            )}
                            {item.headline && <Text style={styles.slideHeadline}>{item.headline}</Text>}
                            {item.description && <Text style={styles.slideDesc}>{item.description}</Text>}
                            {item.button_text && (
                                <View style={styles.slideBtn}>
                                    <Text style={styles.slideBtnText}>{item.button_text}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            />
            {items.length > 1 && (
                <>
                    <TouchableOpacity style={[styles.arrow, styles.arrowLeft]}
                                      onPress={() => goTo((current - 1 + items.length) % items.length)}>
                        <ChevronLeft size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.arrow, styles.arrowRight]}
                                      onPress={() => goTo((current + 1) % items.length)}>
                        <ChevronRight size={18} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.dots}>
                        {items.map((_, i) => (
                            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
                        ))}
                    </View>
                </>
            )}
        </View>
    );
};

// ── Product Card ──────────────────────────────
interface ProductCardProps {
    product: Product;
    onPress: () => void;
}

const ProductCard = ({ product, onPress }: ProductCardProps): JSX.Element => {
    const hasDiscount = product.discount_price != null &&
        parseFloat(product.discount_price) < parseFloat(product.base_price);
    const pct = hasDiscount
        ? Math.round((1 - parseFloat(product.discount_price!) / parseFloat(product.base_price)) * 100)
        : 0;
    return (
        <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
            <View>
                {product.primary_image
                    ? <Image source={{ uri: product.primary_image }} style={styles.productImg} />
                    : <View style={[styles.productImg, { backgroundColor: '#f5f0fa' }]} />
                }
                {hasDiscount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{pct}%</Text>
                    </View>
                )}
            </View>
            <View style={{ padding: 9 }}>
                {product.vendor_name && (
                    <Text style={styles.vendorName} numberOfLines={1}>{product.vendor_name}</Text>
                )}
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productPrice}>
                    {formatCurrency(hasDiscount ? product.discount_price : product.base_price)}
                </Text>
                {hasDiscount && (
                    <Text style={styles.originalPrice}>{formatCurrency(product.base_price)}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

// ── Section Header ────────────────────────────
interface SectionHeaderProps {
    title:      string;
    subtitle?:  string;
    onViewAll:  () => void;
}

const SectionHeader = ({ title, subtitle, onViewAll }: SectionHeaderProps): JSX.Element => (
    <View style={styles.sectionHeader}>
        <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
        <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View all →</Text>
        </TouchableOpacity>
    </View>
);

// ── Main Screen ───────────────────────────────
export default function HomeScreen(): JSX.Element {
    const router    = useRouter();
    const { user }  = useAuthStore();
    const cartCount = useCartStore((s) => s.count);
    const [refreshing, setRefreshing] = useState(false);

    const { data: slides, refetch: r1 } = useQuery({
        queryKey: ['carousel'],
        queryFn:  getCarousel,
        select:   (res) => res.data.data.slides as CarouselSlide[],
        staleTime: 5 * 60 * 1000,
    });

    const { data: featured, refetch: r2 } = useQuery({
        queryKey: ['products', 'featured'],
        queryFn:  () => getProducts({ featured: 'true', limit: 10 }),
        select:   (res) => res.data.data.products as Product[],
    });

    const { data: newArrivals, refetch: r3 } = useQuery({
        queryKey: ['products', 'new-arrivals'],
        queryFn:  () => getProducts({ sortBy: 'created_at', sortOrder: 'DESC', limit: 10 }),
        select:   (res) => res.data.data.products as Product[],
    });

    const { data: electronics, refetch: r4 } = useQuery({
        queryKey: ['products', 'electronics'],
        queryFn:  () => getProducts({ category: 'electronics', limit: 10 }),
        select:   (res) => res.data.data.products as Product[],
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn:  getCategories,
        select:   (res) => res.data.data.categories as Category[],
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([r1(), r2(), r3(), r4()]);
        setRefreshing(false);
    }, [r1, r2, r3, r4]);

    const renderProduct = ({ item }: { item: Product }) => (
        <ProductCard product={item} onPress={() => router.push(`/product/${item.slug}` as never)} />
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.logoBox}>
                        <Image
                            source={require('../../assets/images/Logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: Colors.background }}>
                            Hello, {user?.firstName ?? 'Shopper'} 👋
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity style={{ padding: 8 }}
                                      onPress={() => router.push('/(tabs)/products' as never)}>
                        <Search size={20} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ padding: 8, position: 'relative' }}
                                      onPress={() => router.push('/(tabs)/cart' as never)}>
                        <ShoppingCart size={20} color={Colors.primary} />
                        {cartCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                                    {cartCount > 99 ? '99+' : cartCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                <Carousel slides={slides} />

                {(categories?.length ?? 0) > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title="Shop by Category"
                                       onViewAll={() => router.push('/(tabs)/products' as never)} />
                        <FlatList<Category>
                            data={categories!.slice(0, 12)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(c) => c.id}
                            contentContainerStyle={styles.hList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.catChip}
                                    onPress={() => router.push(`/(tabs)/products?category=${item.slug}` as never)}
                                >
                                    <Text style={styles.catChipText} numberOfLines={1}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {(featured?.length ?? 0) > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title="Featured Products" subtitle="Handpicked deals just for you"
                                       onViewAll={() => router.push('/(tabs)/products?featured=true' as never)} />
                        <FlatList<Product> data={featured} horizontal showsHorizontalScrollIndicator={false}
                                           keyExtractor={(p) => p.id} contentContainerStyle={styles.hList}
                                           renderItem={renderProduct} />
                    </View>
                )}

                {(newArrivals?.length ?? 0) > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title="New Arrivals" subtitle="Fresh products added this week"
                                       onViewAll={() => router.push('/(tabs)/products' as never)} />
                        <FlatList<Product> data={newArrivals} horizontal showsHorizontalScrollIndicator={false}
                                           keyExtractor={(p) => p.id} contentContainerStyle={styles.hList}
                                           renderItem={renderProduct} />
                    </View>
                )}

                {(electronics?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader title="Shop Electronics" subtitle="Best electronics deals"
                                       onViewAll={() => router.push('/(tabs)/products?category=electronics' as never)} />
                        <FlatList<Product> data={electronics} horizontal showsHorizontalScrollIndicator={false}
                                           keyExtractor={(p) => p.id} contentContainerStyle={styles.hList}
                                           renderItem={renderProduct} />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:        { flex: 1, backgroundColor: Colors.background },
    header:           { flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 10, backgroundColor: Colors.secondary },
    logoBox:          { alignItems: 'center', justifyContent: 'center' },
    logoImage:     { width: 100, height: 100 },
    logoText:         { fontSize: 18, fontWeight: '900', color: Colors.primary },
    cartBadge:        { position: 'absolute', top: 2, right: 2, backgroundColor: Colors.error,
        borderRadius: 8, minWidth: 16, height: 16,
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
    carouselContainer:{ height: SLIDE_HEIGHT, backgroundColor: Colors.secondary, position: 'relative' },
    carouselPlaceholder:{ alignItems: 'center', justifyContent: 'center' },
    placeholderTitle: { fontSize: 22, fontWeight: '900', color: Colors.primary },
    placeholderSub:   { fontSize: 13, color: Colors.background, marginTop: 4 },
    slide:            { width, height: SLIDE_HEIGHT },
    slideImg:         { width: '100%', height: '100%' },
    slidePlaceholder: { backgroundColor: '#2d1244' },
    slideOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    slideContent:     { position: 'absolute', bottom: 40, maxWidth: '70%', gap: 6 },
    slideLeft:        { left: 20 },
    slideRight:       { right: 20, alignItems: 'flex-end' },
    slideCenter:      { left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
    badge:            { backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 3,
        borderRadius: 20, alignSelf: 'flex-start' },
    badgeText:        { fontSize: 9, fontWeight: '800', color: Colors.primary,
        textTransform: 'uppercase', letterSpacing: 0.5 },
    slideHeadline:    { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 26 },
    slideDesc:        { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
    slideBtn:         { backgroundColor: Colors.secondary, paddingHorizontal: 14,
        paddingVertical: 7, borderRadius: 10, alignSelf: 'flex-start' },
    slideBtnText:     { fontSize: 12, fontWeight: '800', color: Colors.primary },
    arrow:            { position: 'absolute', top: SLIDE_HEIGHT / 2 - 18, width: 36, height: 36,
        borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center', justifyContent: 'center' },
    arrowLeft:        { left: 10 },
    arrowRight:       { right: 10 },
    dots:             { position: 'absolute', bottom: 10, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive:        { backgroundColor: Colors.secondary, width: 18 },
    section:          { marginTop: 16 },
    sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 10 },
    sectionTitle:     { fontSize: 16, fontWeight: '800', color: Colors.text },
    sectionSubtitle:  { fontSize: 11, color: Colors.textLight, marginTop: 1 },
    viewAll:          { fontSize: 12, color: Colors.primary, fontWeight: '600' },
    hList:            { paddingHorizontal: 16, gap: 12 },
    catChip:          { backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
        minWidth: 80, alignItems: 'center' },
    catChipText:      { fontSize: 12, fontWeight: '600', color: Colors.primary },
    productCard:      { width: 155, backgroundColor: Colors.white, borderRadius: 14,
        overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
    productImg:       { width: '100%', height: 130 },
    discountBadge:    { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.error,
        borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
    discountText:     { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    vendorName:       { fontSize: 9, color: Colors.textLight, textTransform: 'uppercase',
        letterSpacing: 0.4, marginBottom: 2 },
    productName:      { fontSize: 12, fontWeight: '600', color: Colors.text,
        marginBottom: 4, lineHeight: 17 },
    productPrice:     { fontSize: 13, fontWeight: '800', color: Colors.primary },
    originalPrice:    { fontSize: 10, color: Colors.textLight, textDecorationLine: 'line-through' },
});
