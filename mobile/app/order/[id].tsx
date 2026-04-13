import {
    View, Text, Image, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, MapPin, CreditCard, XCircle } from 'lucide-react-native';
import { getOrder, cancelOrder } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import type { Order } from '../../src/types/index';
import { JSX, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal} from "react";

const statusColors: Record<string, { bg: string; text: string }> = {
    pending: {bg: '#fef9c3', text: '#854d0e'},
    confirmed: {bg: '#dbeafe', text: '#1e40af'},
    processing: {bg: '#ede9fe', text: '#5b21b6'},
    shipped: {bg: '#dbeafe', text: '#1d4ed8'},
    delivered: {bg: '#dcfce7', text: '#166534'},
    cancelled: {bg: '#fee2e2', text: '#991b1b'},
};

const InfoRow = ({label, value}: { label: string; value: string }): JSX.Element => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

export default function OrderDetailScreen(): JSX.Element {
    const {id} = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const qc = useQueryClient();

    const {data: order, isLoading} = useQuery({
        queryKey: ['order', id],
        queryFn: () => getOrder(id!),
        select: (res) => res.data.data.order as Order,
        enabled: !!id,
    });

    const cancelMutation = useMutation({
        mutationFn: () => cancelOrder(id!),
        onSuccess: () => {
            void qc.invalidateQueries({queryKey: ['order', id]});
            void qc.invalidateQueries({queryKey: ['orders']});
        },
        onError: (e: any) => alert(e.response?.data?.message ?? 'Cannot cancel this order.'),
    });

    const handleCancel = (): void => {
        Alert.alert('Cancel Order', 'Are you sure?', [
            {text: 'No'},
            {text: 'Cancel Order', style: 'destructive', onPress: () => cancelMutation.mutate()},
        ]);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator color={Colors.primary} style={{marginTop: 60}} size="large"/>
            </SafeAreaView>
        );
    }

    if (!order) return <SafeAreaView style={styles.container}/>;

    const sc = statusColors[order.status] ?? {bg: '#f3f4f6', text: '#374151'};
    const items = order.items ?? [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{padding: 4}}>
                    <ChevronLeft size={25} color={Colors.primary}/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{order.order_number}</Text>
                <View style={{width: 38}}/>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <View style={[styles.statusCard, {backgroundColor: sc.bg}]}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={[styles.statusText, {color: sc.text}]}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                        <Text style={[{fontSize: 12, opacity: 0.7}, {color: sc.text}]}>
                            {new Date(order.created_at).toLocaleDateString('en-NG', {
                                day: 'numeric', month: 'long', year: 'numeric',
                            })}
                        </Text>
                    </View>
                    {order.status === 'pending' && (
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}
                                          disabled={cancelMutation.isPending}>
                            <XCircle size={14} color={Colors.error}/>
                            <Text style={styles.cancelBtnText}>Cancel Order</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Package size={16} color={Colors.primary}/>
                        <Text style={styles.sectionTitle}>Order Items</Text>
                    </View>
                    {items.map((item: { id: Key | null | undefined; product_image: any; product_name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; variant_name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; quantity: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; unit_price: string | number | null | undefined; total_price: string | number | null | undefined; }) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={{ borderRadius: 8, overflow: 'hidden' }}>
                                {item.product_image
                                    ? <Image source={{ uri: item.product_image }} style={styles.itemImage} />
                                    : <View style={[styles.itemImage, { backgroundColor: '#f5f0fa' }]} />
                                }
                            </View>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                                {item.variant_name && <Text style={styles.itemVariant}>{item.variant_name}</Text>}
                                <Text style={styles.itemQty}>
                                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                                </Text>
                            </View>
                            <Text style={styles.itemTotal}>{formatCurrency(item.total_price)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MapPin size={16} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>Shipping Address</Text>
                    </View>
                    <InfoRow label="Name"    value={order.shipping_name} />
                    <InfoRow label="Phone"   value={order.shipping_phone} />
                    <InfoRow label="Address" value={order.shipping_address} />
                    <InfoRow label="City"    value={`${order.shipping_city}, ${order.shipping_state}`} />
                    {order.notes && <InfoRow label="Notes" value={order.notes} />}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <CreditCard size={16} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>Payment Summary</Text>
                    </View>
                    <InfoRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                    <InfoRow label="Shipping" value={formatCurrency(order.shipping_fee)} />
                    <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 8 }} />
                    <View style={styles.infoRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(order.total_amount)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Payment Status</Text>
                        <View style={[styles.payBadge,
                            { backgroundColor: order.payment_status === 'paid' ? '#dcfce7' : '#fef9c3' }]}>
                            <Text style={{ fontSize: 11, fontWeight: '700',
                                color: order.payment_status === 'paid' ? '#166534' : '#854d0e' }}>
                                {order.payment_status?.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: Colors.background },
    header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.secondary,
        borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle:  { fontSize: 15, fontWeight: '800', color: Colors.primary },
    scroll:       { padding: 16, gap: 12 },
    statusCard:   { borderRadius: 16, padding: 14 },
    statusText:   { fontSize: 16, fontWeight: '800' },
    cancelBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, alignSelf: 'flex-start' },
    cancelBtnText:{ fontSize: 13, color: Colors.error, fontWeight: '600' },
    section:      { backgroundColor: Colors.white, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: Colors.border },
    sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
    itemRow:      { flexDirection: 'row', gap: 10, marginBottom: 12,
        paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    itemImage:    { width: 56, height: 56 },
    itemInfo:     { flex: 1 },
    itemName:     { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 2 },
    itemVariant:  { fontSize: 11, color: Colors.textLight, marginBottom: 2 },
    itemQty:      { fontSize: 11, color: Colors.textLight },
    itemTotal:    { fontSize: 13, fontWeight: '800', color: Colors.secondary },
    infoRow:      { flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 8 },
    infoLabel:    { fontSize: 12, color: Colors.textLight, flex: 1 },
    infoValue:    { fontSize: 13, color: Colors.text, fontWeight: '500', flex: 2, textAlign: 'right' },
    totalLabel:   { fontSize: 14, fontWeight: '800', color: Colors.text, flex: 1 },
    totalValue:   { fontSize: 15, fontWeight: '900', color: Colors.secondary },
    payBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
