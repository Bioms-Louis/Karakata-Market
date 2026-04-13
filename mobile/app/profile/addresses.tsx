import {
    View, Text, TouchableOpacity, StyleSheet,
    FlatList, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Package } from 'lucide-react-native';
import { JSX } from 'react';
import { getMyAddresses } from '@/src/api';
import { Colors } from '@/constants/colors';

interface Address {
    shipping_name:    string;
    shipping_phone:   string;
    shipping_address: string;
    shipping_city:    string;
    shipping_state:   string;
    shipping_country: string;
    last_used:        string;
}

export default function AddressesScreen(): JSX.Element {
    const router = useRouter();

    const { data: addresses = [], isLoading } = useQuery({
        queryKey: ['my-addresses'],
        queryFn:  getMyAddresses,
        select:   (res) => res.data.data.addresses as Address[],
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <View style={{ width: 38 }} />
            </View>

            {isLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
            ) : addresses.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIcon}>
                        <MapPin size={36} color={Colors.primary} opacity={0.4} />
                    </View>
                    <Text style={styles.emptyTitle}>No saved addresses</Text>
                    <Text style={styles.emptyText}>
                        Addresses from your past orders will appear here.
                    </Text>
                    <TouchableOpacity
                        style={styles.shopBtn}
                        onPress={() => router.push('/(tabs)/products' as never)}
                    >
                        <Text style={styles.shopBtnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList<Address>
                    data={addresses}
                    keyExtractor={(a, i) => `${a.shipping_address}-${a.shipping_city}-${i}`}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <Text style={styles.listHint}>
                            These addresses were saved from your past orders.
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.addressCard}>
                            {/* Header row */}
                            <View style={styles.addressCardHeader}>
                                <View style={styles.addressIcon}>
                                    <MapPin size={16} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.addressName}>{item.shipping_name}</Text>
                                    <Text style={styles.addressPhone}>{item.shipping_phone}</Text>
                                </View>
                                <View style={styles.lastUsedBadge}>
                                    <Package size={10} color={Colors.textLight} />
                                    <Text style={styles.lastUsedText}>
                                        {new Date(item.last_used).toLocaleDateString('en-NG', {
                                            month: 'short', year: 'numeric',
                                        })}
                                    </Text>
                                </View>
                            </View>

                            {/* Address lines */}
                            <View style={styles.addressBody}>
                                <Text style={styles.addressLine}>{item.shipping_address}</Text>
                                <Text style={styles.addressLine}>
                                    {item.shipping_city}, {item.shipping_state}
                                </Text>
                                <Text style={styles.addressLine}>{item.shipping_country}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:         { flex: 1, backgroundColor: Colors.background },
    header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.secondary },
    backBtn:           { padding: 4 },
    headerTitle:       { fontSize: 17, fontWeight: '800', color: Colors.primary },
    empty:             { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon:         { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f5f0fa',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle:        { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    emptyText:         { fontSize: 13, color: Colors.textLight, textAlign: 'center',
        marginBottom: 24, lineHeight: 20 },
    shopBtn:           { backgroundColor: Colors.secondary, paddingHorizontal: 28,
        paddingVertical: 14, borderRadius: 14 },
    shopBtnText:       { color: Colors.primary, fontWeight: '800', fontSize: 15 },
    list:              { padding: 16, gap: 12 },
    listHint:          { fontSize: 12, color: Colors.textLight, marginBottom: 8,
        textAlign: 'center' },
    addressCard:       { backgroundColor: Colors.white, borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: Colors.border },
    addressCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    addressIcon:       { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f5f0fa',
        alignItems: 'center', justifyContent: 'center' },
    addressName:       { fontSize: 14, fontWeight: '700', color: Colors.text },
    addressPhone:      { fontSize: 12, color: Colors.textLight, marginTop: 1 },
    lastUsedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.background, paddingHorizontal: 8,
        paddingVertical: 4, borderRadius: 8 },
    lastUsedText:      { fontSize: 10, color: Colors.textLight },
    addressBody:       { paddingLeft: 44 },
    addressLine:       { fontSize: 13, color: Colors.text, lineHeight: 20 },
});
