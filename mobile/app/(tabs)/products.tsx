import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    Image, StyleSheet, ActivityIndicator, Modal, ScrollView,
    Pressable, Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, SlidersHorizontal, ChevronDown, Check, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { JSX, useState, useCallback, useEffect } from 'react';
import { getProducts, getCategories } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import type { Product, ProductParams, Category } from '@/src/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Types ────────────────────────────────────
interface ActiveFilters {
    category:  string;
    minPrice:  string;
    maxPrice:  string;
    brand:     string;
    rating:    string;
    sortBy:    string;
    sortOrder: string;
    featured:  string;
}

const DEFAULT_FILTERS: ActiveFilters = {
    category:  '',
    minPrice:  '',
    maxPrice:  '',
    brand:     '',
    rating:    '',
    sortBy:    'created_at',
    sortOrder: 'DESC',
    featured:  '',
};

const SORT_OPTIONS = [
    { label: 'Newest first',     sortBy: 'created_at',   sortOrder: 'DESC' },
    { label: 'Oldest first',     sortBy: 'created_at',   sortOrder: 'ASC'  },
    { label: 'Price: low-high',  sortBy: 'base_price',   sortOrder: 'ASC'  },
    { label: 'Price: high-low',  sortBy: 'base_price',   sortOrder: 'DESC' },
    { label: 'Top rated',        sortBy: 'average_rating', sortOrder: 'DESC' },
    { label: 'Best selling',     sortBy: 'total_sold',   sortOrder: 'DESC' },
];

// ── Product Card ──────────────────────────────
const ProductCard = ({ product, onPress }: { product: Product; onPress: () => void }): JSX.Element => {
    const hasDiscount = product.discount_price != null &&
        parseFloat(product.discount_price) < parseFloat(product.base_price);
    const pct = hasDiscount
        ? Math.round((1 - parseFloat(product.discount_price!) / parseFloat(product.base_price)) * 100) : 0;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <View>
                {product.primary_image
                    ? <Image source={{ uri: product.primary_image }} style={styles.image} />
                    : <View style={[styles.image, { backgroundColor: '#f5f0fa' }]} />
                }
                {hasDiscount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>-{pct}%</Text>
                    </View>
                )}
            </View>
            <View style={{ padding: 10 }}>
                {product.vendor_name && (
                    <Text style={styles.vendor} numberOfLines={1}>{product.vendor_name}</Text>
                )}
                <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.price}>
                    {formatCurrency(hasDiscount ? product.discount_price : product.base_price)}
                </Text>
                {hasDiscount && (
                    <Text style={styles.originalPrice}>{formatCurrency(product.base_price)}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

// ── Filter Chip ───────────────────────
interface ChipProps { label: string; onRemove: () => void; }
const FilterChip = ({ label, onRemove }: ChipProps): JSX.Element => (
    <View style={styles.chip}>
        <Text style={styles.chipText}>{label}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
            <X size={11} color={Colors.primary} />
        </TouchableOpacity>
    </View>
);

// ── Filter Bottom Sheet (All filters included) ───────────────────────
interface FilterSheetProps {
    visible: boolean;
    filters: ActiveFilters;
    categories: Category[];
    onApply: (f: ActiveFilters) => void;
    onClose: () => void;
}

const FilterSheet = ({ visible, filters, categories, onApply, onClose }: FilterSheetProps): JSX.Element => {
    const [local, setLocal] = useState<ActiveFilters>(filters);
    const set = (k: keyof ActiveFilters, v: string) => setLocal(f => ({ ...f, [k]: v }));
    const [catExpanded, setCatExpanded] = useState(true);

    const handleOpen = useCallback(() => setLocal(filters), [filters]);

    const flatCats = (cats: Category[], depth = 0): { cat: Category; depth: number }[] => {
        const result: { cat: Category; depth: number }[] = [];
        for (const c of cats) {
            result.push({ cat: c, depth });
            if (c.children?.length) result.push(...flatCats(c.children, depth + 1));
        }
        return result;
    };
    const flatCategories = flatCats(categories);

    const inputClass = (active: boolean) => ({
        ...styles.priceInput,
        borderColor: active ? Colors.primary : Colors.border,
    });

    return (
        <Modal visible={visible} transparent animationType="slide" onShow={handleOpen} onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={styles.sheet}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Filter & Sort</Text>
                    <TouchableOpacity onPress={() => setLocal(DEFAULT_FILTERS)}>
                        <Text style={styles.clearAll}>Clear all</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                    {/* Sort */}
                    <Text style={styles.filterSectionTitle}>Sort by</Text>
                    <View style={styles.sortGrid}>
                        {SORT_OPTIONS.map((opt) => {
                            const active = opt.sortBy === local.sortBy && opt.sortOrder === local.sortOrder;
                            return (
                                <TouchableOpacity
                                    key={`${opt.sortBy}-${opt.sortOrder}`}
                                    style={[styles.sortChip, active && styles.sortChipActive]}
                                    onPress={() => { set('sortBy', opt.sortBy); set('sortOrder', opt.sortOrder); }}
                                >
                                    <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Categories */}
                    {flatCategories.length > 0 && (
                        <>
                            <TouchableOpacity style={styles.collapsibleHeader} onPress={() => setCatExpanded(e => !e)}>
                                <Text style={styles.filterSectionTitle}>Category</Text>
                                <ChevronDown size={18} color={Colors.textLight}
                                             style={{ transform: [{ rotate: catExpanded ? '180deg' : '0deg' }] }} />
                            </TouchableOpacity>

                            {catExpanded && (
                                <>
                                    <TouchableOpacity style={[styles.catRow, !local.category && styles.catRowActive]}
                                                      onPress={() => set('category', '')}>
                                        <Text style={[styles.catRowText, !local.category && styles.catRowTextActive]}>
                                            All Categories
                                        </Text>
                                        {!local.category && <Check size={14} color={Colors.primary} />}
                                    </TouchableOpacity>

                                    {flatCategories.map(({ cat, depth }) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[styles.catRow, { paddingLeft: 16 + depth * 16 }, local.category === cat.slug && styles.catRowActive]}
                                            onPress={() => set('category', cat.slug)}
                                        >
                                            {depth > 0 && <Text style={styles.catIndent}>{'└ '}</Text>}
                                            <Text style={[styles.catRowText, depth > 0 && styles.catRowSubtext, local.category === cat.slug && styles.catRowTextActive]}>
                                                {cat.name}
                                            </Text>
                                            {local.category === cat.slug && <Check size={14} color={Colors.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}
                        </>
                    )}

                    {/* Price Range */}
                    <Text style={styles.filterSectionTitle}>Price Range (₦)</Text>
                    <View style={styles.priceRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.priceLabel}>Min price</Text>
                            <TextInput
                                style={inputClass(!!local.minPrice)}
                                placeholder="0"
                                keyboardType="numeric"
                                value={local.minPrice}
                                onChangeText={(v) => set('minPrice', v.replace(/[^0-9]/g, ''))}
                            />
                        </View>
                        <View style={styles.priceDash} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.priceLabel}>Max price</Text>
                            <TextInput
                                style={inputClass(!!local.maxPrice)}
                                placeholder="Any"
                                keyboardType="numeric"
                                value={local.maxPrice}
                                onChangeText={(v) => set('maxPrice', v.replace(/[^0-9]/g, ''))}
                            />
                        </View>
                    </View>

                    {/* Brand */}
                    <Text style={styles.filterSectionTitle}>Brand</Text>
                    <TextInput
                        style={[styles.brandInput, !!local.brand && { borderColor: Colors.primary }]}
                        placeholder="e.g. Samsung, Nike, Apple..."
                        value={local.brand}
                        onChangeText={(v) => set('brand', v)}
                    />

                    {/* Minimum Rating */}
                    <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                    <View style={styles.ratingRow}>
                        {[5, 4, 3, 2, 1].map((r) => {
                            const active = local.rating === String(r);
                            return (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.ratingChip, active && styles.ratingChipActive]}
                                    onPress={() => set('rating', active ? '' : String(r))}
                                >
                                    <Star size={12} color={active ? Colors.primary : Colors.textLight} fill={active ? Colors.secondary : 'none'} />
                                    <Text style={[styles.ratingChipText, active && styles.ratingChipTextActive]}>{r}+</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Featured Products */}
                    <TouchableOpacity
                        style={[styles.featuredToggle, local.featured === 'true' && styles.featuredToggleActive]}
                        onPress={() => set('featured', local.featured === 'true' ? '' : 'true')}
                    >
                        <Text style={[styles.featuredToggleText, local.featured === 'true' && styles.featuredToggleTextActive]}>
                            ⭐ Featured products only
                        </Text>
                        {local.featured === 'true' && <Check size={16} color={Colors.primary} />}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>

                <View style={styles.sheetFooter}>
                    <TouchableOpacity style={styles.applyBtn} onPress={() => { onApply(local); onClose(); }}>
                        <Text style={styles.applyBtnText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ── Main Products Screen ───────────────────────────────
export default function ProductsScreen(): JSX.Element {
    const router = useRouter();
    const params = useLocalSearchParams<{
        search?: string;
        category?: string;
        featured?: string;
        sortBy?: string;
        sortOrder?: string;
    }>();

    const [search, setSearch] = useState(params.search ?? '');
    const [page, setPage] = useState(1);
    const [filterOpen, setFilterOpen] = useState(false);

    // Initialize filters from URL params safely
    const [filters, setFilters] = useState<ActiveFilters>(() => ({
        ...DEFAULT_FILTERS,
        category: params.category ?? '',
        featured: params.featured ?? '',
        sortBy: params.sortBy ?? 'created_at',
        sortOrder: params.sortOrder ?? 'DESC',
    }));

    // Sync URL params when they change (prevents infinite loop)
    useEffect(() => {
        let hasChanged = false;
        const newFilters: Partial<ActiveFilters> = {};

        if (params.category !== undefined && params.category !== filters.category) {
            newFilters.category = params.category;
            hasChanged = true;
        }
        if (params.featured !== undefined && params.featured !== filters.featured) {
            newFilters.featured = params.featured;
            hasChanged = true;
        }
        if (params.sortBy !== undefined && params.sortBy !== filters.sortBy) {
            newFilters.sortBy = params.sortBy;
            hasChanged = true;
        }
        if (params.sortOrder !== undefined && params.sortOrder !== filters.sortOrder) {
            newFilters.sortOrder = params.sortOrder;
            hasChanged = true;
        }

        if (hasChanged) {
            setFilters(prev => ({ ...prev, ...newFilters }));
            setPage(1);
        }

        if (params.search !== undefined && params.search !== search) {
            setSearch(params.search);
            setPage(1);
        }
    }, [params.category, params.featured, params.sortBy, params.sortOrder, params.search]);

    const queryParams: ProductParams = {
        search: search || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        brand: filters.brand || undefined,
        rating: filters.rating || undefined,
        featured: filters.featured || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page,
        limit: 20,
    };

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['products', queryParams],
        queryFn: () => getProducts(queryParams),
        select: (res) => res.data.data,
        placeholderData: (prev) => prev,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        select: (res) => res.data.data.categories as Category[],
    });

    const products = (data?.products as Product[]) ?? [];
    const pagination = data?.pagination;

    const activeFilterCount = [
        filters.category, filters.minPrice, filters.maxPrice,
        filters.brand, filters.rating, filters.featured,
        (filters.sortBy !== 'created_at' || filters.sortOrder !== 'DESC') ? '1' : '',
    ].filter(Boolean).length;

    const removeFilter = (key: keyof ActiveFilters) => {
        setFilters(f => ({
            ...f,
            [key]: key === 'sortBy' ? 'created_at' : key === 'sortOrder' ? 'DESC' : '',
        }));
        setPage(1);
    };

    const activeChips: { key: keyof ActiveFilters; label: string }[] = [];
    if (filters.category) activeChips.push({ key: 'category', label: filters.category.replace(/-/g, ' ') });
    if (filters.minPrice) activeChips.push({ key: 'minPrice', label: `Min ₦${parseInt(filters.minPrice).toLocaleString()}` });
    if (filters.maxPrice) activeChips.push({ key: 'maxPrice', label: `Max ₦${parseInt(filters.maxPrice).toLocaleString()}` });
    if (filters.brand) activeChips.push({ key: 'brand', label: filters.brand });
    if (filters.rating) activeChips.push({ key: 'rating', label: `${filters.rating}★ & up` });
    if (filters.featured) activeChips.push({ key: 'featured', label: 'Featured' });
    if (filters.sortBy !== 'created_at' || filters.sortOrder !== 'DESC') {
        const s = SORT_OPTIONS.find(o => o.sortBy === filters.sortBy && o.sortOrder === filters.sortOrder);
        if (s) activeChips.push({ key: 'sortBy', label: s.label });
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>
                        {filters.category
                            ? filters.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                            : search ? `Results for "${search}"` : 'All Products'}
                    </Text>
                    {pagination && <Text style={styles.count}>{pagination.total} products</Text>}
                </View>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Search size={16} color={Colors.textLight} />
                    <TextInput
                        value={search}
                        onChangeText={(t) => { setSearch(t); setPage(1); }}
                        placeholder="Search products..."
                        placeholderTextColor={Colors.textLight}
                        style={styles.searchInput}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <X size={16} color={Colors.textLight} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                    onPress={() => setFilterOpen(true)}
                >
                    <SlidersHorizontal size={18} color={activeFilterCount > 0 ? Colors.primary : Colors.textLight} />
                    {activeFilterCount > 0 && (
                        <View style={styles.filterCount}>
                            <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {activeChips.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsList}>
                    {activeChips.map((chip) => (
                        <FilterChip key={chip.key} label={chip.label} onRemove={() => removeFilter(chip.key)} />
                    ))}
                    <TouchableOpacity onPress={() => { setFilters(DEFAULT_FILTERS); setSearch(''); setPage(1); }} style={styles.clearChip}>
                        <Text style={styles.clearChipText}>Clear all</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {isLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
            ) : products.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptyText}>Try adjusting your filters</Text>
                    <TouchableOpacity style={styles.clearFiltersBtn} onPress={() => { setFilters(DEFAULT_FILTERS); setSearch(''); setPage(1); }}>
                        <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList<Product>
                    data={products}
                    keyExtractor={(p) => p.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <ProductCard product={item} onPress={() => router.push(`/product/${item.slug}` as never)} />
                    )}
                    ListFooterComponent={
                        isFetching ? <ActivityIndicator color={Colors.primary} style={{ padding: 20 }} /> : pagination ? (
                            <View style={styles.pagination}>
                                <TouchableOpacity style={[styles.pageBtn, !pagination.hasPrevPage && styles.pageBtnDisabled]}
                                                  onPress={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage}>
                                    <ChevronLeft size={18} color={!pagination.hasPrevPage ? '#999' : '#fff'} />
                                </TouchableOpacity>
                                <Text style={styles.pageIndicator}>{page} / {pagination.totalPages}</Text>
                                <TouchableOpacity style={[styles.pageBtn, !pagination.hasNextPage && styles.pageBtnDisabled]}
                                                  onPress={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage}>
                                    <ChevronRight size={18} color={!pagination.hasNextPage ? '#999' : '#fff'} />
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                />
            )}

            <FilterSheet
                visible={filterOpen}
                filters={filters}
                categories={categories}
                onApply={(f) => { setFilters(f); setPage(1); }}
                onClose={() => setFilterOpen(false)}
            />
        </SafeAreaView>
    );
}

// ── Styles (unchanged from your original) ─────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: Colors.secondary },
    title: { fontSize: 20, fontWeight: '800', color: Colors.primary, textTransform: 'capitalize' },
    count: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.secondary },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
    searchInput: { flex: 1, fontSize: 14, color: Colors.text },
    filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    filterBtnActive: { backgroundColor: '#f0ebf8' },
    filterCount: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
    filterCountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    chipsScroll: { maxHeight: 44, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
    chipsList: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f0ebf8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#d4c4ec' },
    chipText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
    clearChip: { paddingHorizontal: 10, paddingVertical: 5 },
    clearChipText: { fontSize: 11, color: Colors.error, fontWeight: '600' },

    list: { padding: 12 },
    row: { justifyContent: 'space-between' },
    card: { width: '48.5%', backgroundColor: Colors.white, borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
    image: { width: '100%', height: 130 },
    discountBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.error, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
    discountBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    vendor: { fontSize: 9, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    name: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 4, lineHeight: 17 },
    price: { fontSize: 13, fontWeight: '800', color: Colors.secondary },
    originalPrice: { fontSize: 10, color: Colors.textLight, textDecorationLine: 'line-through' },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    emptyText: { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginBottom: 20 },
    clearFiltersBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    clearFiltersBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },

    pagination: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 80, paddingHorizontal: 16 },
    pageBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12, minWidth: 90, alignItems: 'center' },
    pageBtnDisabled: { backgroundColor: Colors.border },
    pageBtnText: { color: '#fff', fontWeight: '700' },
    pageIndicator: { fontSize: 14, fontWeight: '700', color: Colors.text, alignSelf: 'center' },

    // Filter Sheet Styles
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_HEIGHT * 0.88 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
    sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    clearAll: { fontSize: 13, color: Colors.error, fontWeight: '600' },
    sheetScroll: { paddingHorizontal: 20, paddingTop: 16 },
    sheetFooter: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
    applyBtn: { backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    applyBtnText: { fontSize: 15, fontWeight: '800', color: Colors.primary },

    filterSectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 10, marginTop: 18, textTransform: 'uppercase', letterSpacing: 0.6 },
    sortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sortChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
    sortChipActive: { borderColor: Colors.primary, backgroundColor: '#f0ebf8' },
    sortChipText: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
    sortChipTextActive: { color: Colors.primary, fontWeight: '700' },

    collapsibleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4, marginTop: 18, marginBottom: 10 },
    catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingRight: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    catRowActive: { backgroundColor: '#f8f5fc' },
    catRowText: { flex: 1, fontSize: 14, color: Colors.text },
    catRowSubtext: { fontSize: 13, color: Colors.textLight },
    catRowTextActive: { color: Colors.primary, fontWeight: '700' },
    catIndent: { fontSize: 12, color: Colors.textLight, marginRight: 2 },

    priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    priceLabel: { fontSize: 11, color: Colors.textLight, marginBottom: 5 },
    priceInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: Colors.text, backgroundColor: '#fafafa' },
    priceDash: { width: 12, height: 1.5, backgroundColor: Colors.border, marginBottom: 18 },

    brandInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: Colors.text, backgroundColor: '#fafafa' },

    ratingRow: { flexDirection: 'row', gap: 8 },
    ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
    ratingChipActive: { borderColor: Colors.primary, backgroundColor: '#f0ebf8' },
    ratingChipText: { fontSize: 12, color: Colors.textLight },
    ratingChipTextActive: { color: Colors.primary, fontWeight: '700' },

    featuredToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, marginTop: 8 },
    featuredToggleActive: { borderColor: Colors.primary, backgroundColor: '#f0ebf8' },
    featuredToggleText: { fontSize: 14, color: Colors.textLight },
    featuredToggleTextActive: { color: Colors.primary, fontWeight: '600' },
});