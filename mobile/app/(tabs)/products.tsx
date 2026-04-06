import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import {JSX, useState } from 'react';
import { getProducts } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import type { Product, ProductParams } from '@/src/api';

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
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>-{pct}%</Text>
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
            </View>
        </TouchableOpacity>
    );
};

export default function ProductsScreen(): JSX.Element {
    const router = useRouter();
    const params = useLocalSearchParams<{ search?: string; category?: string; featured?: string }>();
    const [search, setSearch] = useState(params.search ?? '');
    const [page, setPage]     = useState(1);

    const filters: ProductParams = {
        search:   search || undefined,
        category: params.category || undefined,
        featured: params.featured || undefined,
        page,
        limit: 20,
    };

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['products', filters],
        queryFn:  () => getProducts(filters),
        select:   (res) => res.data.data,
        placeholderData: (prev) => prev,
    });

    const products   = (data?.products as Product[]) ?? [];
    const pagination = data?.pagination;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {params.category
                        ? params.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                        : 'All Products'}
                </Text>
                {pagination && (
                    <Text style={styles.count}>{pagination.total} products</Text>
                )}
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
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <X size={16} color={Colors.textLight} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
            ) : products.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptyText}>Try adjusting your search</Text>
                </View>
            ) : (
                <FlatList<Product>
                    data={products}
                    keyExtractor={(p) => p.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <ProductCard product={item}
                                     onPress={() => router.push(`/product/${item.slug}` as never)} />
                    )}
                    ListFooterComponent={
                        isFetching ? (
                            <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} />
                        ) : pagination?.hasNextPage ? (
                            <TouchableOpacity style={styles.loadMore} onPress={() => setPage((p) => p + 1)}>
                                <Text style={styles.loadMoreText}>Load More</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: Colors.background },
    header:      { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, backgroundColor: Colors.secondary },
    title:       { fontSize: 20, fontWeight: '800', color: Colors.primary, textTransform: 'capitalize' },
    count:       { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    searchRow:   { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.secondary },
    searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: Colors.white, paddingHorizontal: 12,
        paddingVertical: 10, borderRadius: 12 },
    searchInput: { flex: 1, fontSize: 14, color: Colors.text },
    list:        { padding: 12 },
    row:         { justifyContent: 'space-between' },
    card:        { width: '48.5%', backgroundColor: Colors.white, borderRadius: 14,
        marginBottom: 12, overflow: 'hidden',
        borderWidth: 1, borderColor: Colors.border },
    image:       { width: '100%', height: 130 },
    badge:       { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.error,
        borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
    badgeText:   { color: '#fff', fontSize: 9, fontWeight: 'bold' },
    vendor:      { fontSize: 9, color: Colors.textLight, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 2 },
    name:        { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 4, lineHeight: 17 },
    price:       { fontSize: 13, fontWeight: '800', color: Colors.secondary },
    empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon:   { fontSize: 48, marginBottom: 12 },
    emptyTitle:  { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    emptyText:   { fontSize: 13, color: Colors.textLight, textAlign: 'center' },
    loadMore:    { margin: 16, padding: 14, backgroundColor: Colors.primary,
        borderRadius: 12, alignItems: 'center' },
    loadMoreText:{ color: Colors.secondary, fontWeight: '700', fontSize: 14 },
});
