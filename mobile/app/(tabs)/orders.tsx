import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package } from 'lucide-react-native';
import { getOrders } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '../../src/store/authStore';
import type { Order } from '../../src/types';
import { JSX } from "react";

const statusColors: Record<string, { bg: string; text: string }> = {
    pending:    { bg: '#fef9c3', text: '#854d0e' },
    confirmed:  { bg: '#dbeafe', text: '#1e40af' },
    processing: { bg: '#ede9fe', text: '#5b21b6' },
    shipped:    { bg: '#dbeafe', text: '#1d4ed8' },
    delivered:  { bg: '#dcfce7', text: '#166534' },
    cancelled:  { bg: '#fee2e2', text: '#991b1b' },
};

export default function OrdersScreen(): JSX.Element {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn:  () => getOrders({ limit: 20 }),
        select:   (res) => res.data.data.orders as Order[],
        enabled:  isAuthenticated,
    });

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.headerTitle}>My Orders</Text></View>
                <View style={styles.center}>
                    <Package size={60} color={Colors.primary} opacity={0.7} />
                    <Text style={styles.emptyTitle}>Sign in to view orders</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth/login' as never)}>
                        <Text style={styles.btnText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}><Text style={styles.headerTitle}>My Orders</Text></View>

            {isLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
            ) : orders.length === 0 ? (
                <View style={styles.center}>
                    <Package size={60} color={Colors.primary} opacity={0.7} />
                    <Text style={styles.emptyTitle}>No orders yet</Text>
                    <Text style={styles.emptyText}>Your orders will appear here</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/products' as never)}>
                        <Text style={styles.btnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList<Order>
                    data={orders}
                    keyExtractor={(o) => o.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const sc = statusColors[item.status] ?? { bg: '#f3f4f6', text: '#374151' };
                        return (
                            <TouchableOpacity
                                style={styles.orderCard}
                                onPress={() => router.push(`/order/${item.id}` as never)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.orderTop}>
                                    <Text style={styles.orderNumber}>{item.order_number}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                                        <Text style={[styles.statusText, { color: sc.text }]}>
                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.orderBottom}>
                                    <Text style={styles.orderDate}>
                                        {new Date(item.created_at).toLocaleDateString('en-NG', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </Text>
                                    <Text style={styles.orderAmount}>{formatCurrency(item.total_amount)}</Text>
                                </View>
                                {item.item_count != null && (
                                    <Text style={styles.orderItems}>
                                        {item.item_count} {Number(item.item_count) === 1 ? 'item' : 'items'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: Colors.background },
    header:       { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.secondary },
    headerTitle:  { fontSize: 20, fontWeight: '800', color: Colors.primary },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyTitle:   { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 6 },
    emptyText:    { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginBottom: 24 },
    btn:          { backgroundColor: Colors.secondary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    btnText:      { color: Colors.primary, fontWeight: '800', fontSize: 15 },
    list:         { padding: 16, gap: 12 },
    orderCard:    { backgroundColor: Colors.white, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: Colors.border },
    orderTop:     { flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8 },
    orderNumber:  { fontSize: 14, fontWeight: '800', color: Colors.text },
    statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText:   { fontSize: 11, fontWeight: '700' },
    orderBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderDate:    { fontSize: 12, color: Colors.textLight },
    orderAmount:  { fontSize: 15, fontWeight: '800', color: Colors.secondary },
    orderItems:   { fontSize: 11, color: Colors.textLight, marginTop: 4 },
});