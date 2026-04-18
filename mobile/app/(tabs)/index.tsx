import {
    View, Text, ScrollView, TouchableOpacity, Image,
    FlatList, StyleSheet, Dimensions, RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Heart, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState, useEffect, useRef, useCallback, JSX } from 'react';
import { getProducts, getCategories, getCarousel } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '@/src/store/authStore';
import useCartStore from '@/src/store/cartStore';
import type { Product, Category, CarouselSlide } from '@/src/types';

const { width } = Dimensions.get('window');
const SLIDE_HEIGHT = 220;

// ── Carousel Component ──────────────────────────────────
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
                        {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={styles.slideImg} resizeMode="cover" />
                        ) : (
                            <View style={[styles.slideImg, styles.slidePlaceholder]} />
                        )}
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
                {product.primary_image ? (
                    <Image source={{ uri: product.primary_image }} style={styles.productImg} />
                ) : (
                    <View style={[styles.productImg, { backgroundColor: '#f5f0fa' }]} />
                )}
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
    title: string;
    subtitle?: string;
    onViewAll: () => void;
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

// ── Main Home Screen ───────────────────────────────
export default function HomeScreen(): JSX.Element {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const cartCount = useCartStore((s) => s.count);

    const [refreshing, setRefreshing] = useState(false);

    // Wishlist count placeholder
    const wishlistCount = 0;

    const { data: slides, refetch: r1 } = useQuery({
        queryKey: ['carousel'],
        queryFn: getCarousel,
        select: (res) => res.data.data.slides as CarouselSlide[],
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const { data: featured, refetch: r2, isLoading: loadingFeatured } = useQuery({
        queryKey: ['products', 'featured'],
        queryFn: () => getProducts({ featured: 'true', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: newArrivals, refetch: r3 } = useQuery({
        queryKey: ['products', 'new-arrivals'],
        queryFn: () => getProducts({ sortBy: 'created_at', sortOrder: 'DESC', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: electronics, refetch: r4 } = useQuery({
        queryKey: ['products', 'electronics'],
        queryFn: () => getProducts({ category: 'electronics', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: phones, refetch: r5 } = useQuery({
        queryKey: ['products', 'smartphones'],
        queryFn: () => getProducts({ category: 'smartphones', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: menFashion, refetch: r6 } = useQuery({
        queryKey: ['products', 'mens-fashion'],
        queryFn: () => getProducts({ category: 'mens-fashion', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: womenFashion, refetch: r7 } = useQuery({
        queryKey: ['products', 'womens-fashion'],
        queryFn: () => getProducts({ category: 'womens-fashion', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: tablets, refetch: r8 } = useQuery({
        queryKey: ['products', 'ipad-tablets'],
        queryFn: () => getProducts({ category: 'ipad-tablets', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: mobile, refetch: r9 } = useQuery({
        queryKey: ['products', 'mobile-accessories'],
        queryFn: () => getProducts({ category: 'mobile-accessories', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: laptop, refetch: r10 } = useQuery({
        queryKey: ['products', 'laptop'],
        queryFn: () => getProducts({ category: 'laptop', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: food, refetch: r11 } = useQuery({
        queryKey: ['products', 'food'],
        queryFn: () => getProducts({ category: 'food', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: beverages, refetch: r12 } = useQuery({
        queryKey: ['products', 'beverages'],
        queryFn: () => getProducts({ category: 'beverages', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: healthBeauty, refetch: r13 } = useQuery({
        queryKey: ['products', 'health-beauty'],
        queryFn: () => getProducts({ category: 'health-beauty', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: appliances, refetch: r14 } = useQuery({
        queryKey: ['products', 'appliances'],
        queryFn: () => getProducts({ category: 'appliances', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: television, refetch: r15 } = useQuery({
        queryKey: ['products', 'television'],
        queryFn: () => getProducts({ category: 'television', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: accessories, refetch: r16 } = useQuery({
        queryKey: ['products', 'electronic-accessories'],
        queryFn: () => getProducts({ category: 'electronic-accessories', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: homeOffice, refetch: r17 } = useQuery({
        queryKey: ['products', 'home-office'],
        queryFn: () => getProducts({ category: 'home-office', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: sleepWellness, refetch: r18 } = useQuery({
        queryKey: ['products', 'sleep-wellness'],
        queryFn: () => getProducts({ category: 'sleep-wellness', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: gaming, refetch: r19 } = useQuery({
        queryKey: ['products', 'gaming'],
        queryFn: () => getProducts({ category: 'gaming', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: toy, refetch: r20 } = useQuery({
        queryKey: ['products', 'toys-games'],
        queryFn: () => getProducts({ category: 'toys-games', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: automobile, refetch: r21 } = useQuery({
        queryKey: ['products', 'automobile'],
        queryFn: () => getProducts({ category: 'automobile', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });

    const { data: baby, refetch: r22 } = useQuery({
        queryKey: ['products', 'baby-products'],
        queryFn: () => getProducts({ category: 'baby-products', limit: 10 }),
        select: (res) => res.data.data.products as Product[],
        retry: 1,
    });


    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        select: (res) => res.data.data.categories as Category[],
        retry: 1,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([r1(), r2(), r3(), r4(), r5(), r6(), r7(), r8(),
            r9(), r10(), r11(), r12(), r13(), r14(),
        r15(), r16(), r17(), r18(), r19(), r20(), r21(), r22()]);
        setRefreshing(false);
    }, [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14,
    r15, r16, r17, r18, r19, r20, r21, r22]);

    const renderProduct = ({ item }: { item: Product }) => (
        <ProductCard product={item} onPress={() => router.push(`/product/${item.slug}` as never)} />
    );

    // Navigation Helpers
    const goToProductsWithFilter = (params: string) => {
        router.push(`/(tabs)/products${params}` as never);
    };

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
                </View>

                <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity style={{ padding: 8 }}
                                      onPress={() => router.push('/(tabs)/products' as never)}>
                        <Search size={20} color={Colors.primary} />
                    </TouchableOpacity>

                    {/* Wishlist Button */}
                    <TouchableOpacity
                        style={{ padding: 8, position: 'relative' }}
                        onPress={() => router.push('/wishlist' as never)}
                    >
                        <Heart size={20} color={Colors.primary} />
                        {wishlistCount > 0 && (
                            <View style={styles.wishlistBadge}>
                                <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>
                                    {wishlistCount > 99 ? '99+' : wishlistCount}
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

                {loadingFeatured && (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={{ marginTop: 12, color: Colors.textLight, fontSize: 13 }}>
                            Loading products...
                        </Text>
                    </View>
                )}

                {/* Shop by Category */}
                {(categories?.length ?? 0) > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Shop by Category"
                            onViewAll={() => goToProductsWithFilter('')}
                        />
                        <FlatList<Category>
                            data={categories!.slice(0, 12)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(c) => c.id}
                            contentContainerStyle={styles.hList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.catChip}
                                    onPress={() => goToProductsWithFilter(`?category=${item.slug}`)}
                                >
                                    <Text style={styles.catChipText} numberOfLines={1}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Featured Products */}
                {(featured?.length ?? 0) > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Featured Products"
                            subtitle="Handpicked deals just for you"
                            onViewAll={() => goToProductsWithFilter('?featured=true')}
                        />
                        <FlatList<Product>
                            data={featured}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* New Arrivals */}
                {(newArrivals?.length ?? 0) > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="New Arrivals"
                            subtitle="Fresh products added this week"
                            onViewAll={() => goToProductsWithFilter('?sortBy=created_at&sortOrder=DESC')}
                        />
                        <FlatList<Product>
                            data={newArrivals}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Electronics */}
                {(electronics?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Shop Electronics"
                            subtitle="Best electronics deals"
                            onViewAll={() => goToProductsWithFilter('?category=electronics')}
                        />
                        <FlatList<Product>
                            data={electronics}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Appliances */}
                {(appliances?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Shop Appliances"
                            subtitle="From small appliances to large appliances"
                            onViewAll={() => goToProductsWithFilter('?category=appliances')}
                        />
                        <FlatList<Product>
                            data={appliances}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* SmartPhones */}
                {(phones?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Get Deals on Latest Gadgets"
                            subtitle="Shop for your Smartphones"
                            onViewAll={() => goToProductsWithFilter('?category=smartphones')}
                        />
                        <FlatList<Product>
                            data={phones}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* iPad & Tablets */}
                {(tablets?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Get Deals on iPads & Tablets"
                            subtitle="Shop for your iPads & Tablets"
                            onViewAll={() => goToProductsWithFilter('?category=ipad-tablets')}
                        />
                        <FlatList<Product>
                            data={tablets}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Mobile Accessories */}
                {(mobile?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Shop Mobile Accessories"
                            subtitle="Shop for all mobile accessories"
                            onViewAll={() => goToProductsWithFilter('?category=mobile-accessories')}
                        />
                        <FlatList<Product>
                            data={mobile}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Laptops */}
                {(laptop?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Power Meets Price"
                            subtitle="Unbeatable laptop deals just for you"
                            onViewAll={() => goToProductsWithFilter('?category=laptop')}
                        />
                        <FlatList<Product>
                            data={laptop}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Televison */}
                {(television?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Television Deals"
                            subtitle="Smart TVs, OLED, QLED, get great deals"
                            onViewAll={() => goToProductsWithFilter('?category=television')}
                        />
                        <FlatList<Product>
                            data={television}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Electronic Accessories */}
                {(accessories?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Electronic Accessories"
                            subtitle="Speakers, headphones, smart watches, and more"
                            onViewAll={() => goToProductsWithFilter('?category=electronic-accessories')}
                        />
                        <FlatList<Product>
                            data={accessories}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Men's Fashion */}
                {(menFashion?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Men's Fashion"
                            subtitle="Trending clothing, shoes, accessories & more"
                            onViewAll={() => goToProductsWithFilter('?category=mens-fashion')}
                        />
                        <FlatList<Product>
                            data={menFashion}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Women's Fashion */}
                {(womenFashion?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Women's Fashion"
                            subtitle="Dresses, shoes, handbags, jewelry & everything in between"
                            onViewAll={() => goToProductsWithFilter('?category=womens-fashion')}
                        />
                        <FlatList<Product>
                            data={womenFashion}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Health & Beauty */}
                {(healthBeauty?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Glow Starts Here"
                            subtitle="Discover skincare, beauty, and wellness essentials"
                            onViewAll={() => goToProductsWithFilter('?category=health-beauty')}
                        />
                        <FlatList<Product>
                            data={healthBeauty}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Food */}
                {(food?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Cook Better, Spend Less"
                            subtitle="Get the best deals on everyday cooking essentials"
                            onViewAll={() => goToProductsWithFilter('?category=food')}
                        />
                        <FlatList<Product>
                            data={food}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Beverages */}
                {(beverages?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Sip Into Refreshment"
                            subtitle="Refreshment for every mood"
                            onViewAll={() => goToProductsWithFilter('?category=beverages')}
                        />
                        <FlatList<Product>
                            data={beverages}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Home and Office */}
                {(homeOffice?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Home and Office"
                            subtitle="Get the best deals on home and office essentials"
                            onViewAll={() => goToProductsWithFilter('?category=home-office')}
                        />
                        <FlatList<Product>
                            data={homeOffice}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Baby Products */}
                {(baby?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Baby Products"
                            subtitle="Get all baby products and essentials"
                            onViewAll={() => goToProductsWithFilter('?category=baby-products')}
                        />
                        <FlatList<Product>
                            data={baby}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Sleep and Wellness */}
                {(sleepWellness?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Sleep and Wellness"
                            subtitle=""
                            onViewAll={() => goToProductsWithFilter('?category=sleep-wellness')}
                        />
                        <FlatList<Product>
                            data={sleepWellness}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Toys and Games */}
                {(toy?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Toys and Games"
                            subtitle="Toys and games and more"
                            onViewAll={() => goToProductsWithFilter('?category=toys-games')}
                        />
                        <FlatList<Product>
                            data={toy}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Gaming */}
                {(gaming?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 24 }]}>
                        <SectionHeader
                            title="Gaming Consoles"
                            subtitle="Gaming consoles for all your gaming needs"
                            onViewAll={() => goToProductsWithFilter('?category=gaming')}
                        />
                        <FlatList<Product>
                            data={gaming}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

                {/* Automobiles */}
                {(automobile?.length ?? 0) > 0 && (
                    <View style={[styles.section, { marginBottom: 100 }]}>
                        <SectionHeader
                            title="Automobiles"
                            subtitle="Brand New, Direct Belgium, Local Used"
                            onViewAll={() => goToProductsWithFilter('?category=automobile')}
                        />
                        <FlatList<Product>
                            data={automobile}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(p) => p.id}
                            contentContainerStyle={styles.hList}
                            renderItem={renderProduct}
                        />
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.secondary,
        height: 70,
    },
    logoBox: { alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 50 },
    logoImage: { width: 100, height: 100 },

    wishlistBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: Colors.error,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },

    carouselContainer: { height: SLIDE_HEIGHT, backgroundColor: Colors.secondary, position: 'relative' },
    carouselPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    placeholderTitle: { fontSize: 22, fontWeight: '900', color: Colors.primary },
    placeholderSub: { fontSize: 13, color: Colors.background, marginTop: 4 },

    slide: { width, height: SLIDE_HEIGHT },
    slideImg: { width: '100%', height: '100%' },
    slidePlaceholder: { backgroundColor: '#2d1244' },
    slideOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    slideContent: { position: 'absolute', bottom: 40, maxWidth: '70%', gap: 6 },
    slideLeft: { left: 20 },
    slideRight: { right: 20, alignItems: 'flex-end' },
    slideCenter: { left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },

    badge: { backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
    badgeText: { fontSize: 9, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    slideHeadline: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 26 },
    slideDesc: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
    slideBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, alignSelf: 'flex-start' },
    slideBtnText: { fontSize: 12, fontWeight: '800', color: Colors.primary },

    arrow: { position: 'absolute', top: SLIDE_HEIGHT / 2 - 18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
    arrowLeft: { left: 10 },
    arrowRight: { right: 10 },
    dots: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: Colors.secondary, width: 18 },

    section: { marginTop: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    sectionSubtitle: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
    viewAll: { fontSize: 12, color: Colors.secondary, fontWeight: '600' },

    hList: { paddingHorizontal: 16, gap: 12 },
    catChip: { backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, minWidth: 80, alignItems: 'center' },
    catChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

    productCard: { width: 155, backgroundColor: Colors.background, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
    productImg: { width: '100%', height: 130 },
    discountBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.error, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
    discountText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    vendorName: { fontSize: 9, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
    productName: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 4, lineHeight: 17 },
    productPrice: { fontSize: 13, fontWeight: '800', color: Colors.secondary },
    originalPrice: { fontSize: 10, color: Colors.textLight, textDecorationLine: 'line-through' },
});