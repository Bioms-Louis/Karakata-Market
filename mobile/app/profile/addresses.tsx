import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, MapPin, Trash2, Edit } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JSX } from 'react';

import { getAddresses, deleteAddress } from '@/src/api'; // Create these API functions
import { Colors } from '@/constants/colors';
import useAuthStore from '../../src/store/authStore';

type Address = {
    id: string;
    fullName: string;
    phoneNumber: string;
    addressLine: string;
    city: string;
    state: string;
    isDefault?: boolean;
};

export default function AddressesScreen(): JSX.Element {
    const router = useRouter();
    const qc = useQueryClient();

    const { data: addresses = [], isLoading } = useQuery({
        queryKey: ['addresses'],
        queryFn: getAddresses,
        select: (res) => res.data.data.addresses as Address[],
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAddress(id),
        onSuccess: () => {
            Alert.alert('Success', 'Address deleted successfully');
            qc.invalidateQueries({ queryKey: ['addresses'] });
        },
        onError: (e: any) => {
            Alert.alert('Error', e.response?.data?.message || 'Failed to delete address');
        },
    });

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
            ]
        );
    };

    const renderAddress = ({ item }: { item: Address }) => (
        <View style={styles.addressCard}>
            {item.isDefault && (
                <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                </View>
            )}

            <View style={styles.addressContent}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.phone}>{item.phoneNumber}</Text>
                <Text style={styles.addressLine}>{item.addressLine}</Text>
                <Text style={styles.cityState}>{item.city}, {item.state}</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Coming Soon', 'Edit address will be available soon')}>
                    <Edit size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <Trash2 size={18} color={Colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/profile/add-address' as never)}
                >
                    <Plus size={22} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll}>
                {isLoading ? (
                    <Text style={styles.loadingText}>Loading addresses...</Text>
                ) : addresses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MapPin size={60} color="#ddd" />
                        <Text style={styles.emptyTitle}>No addresses yet</Text>
                        <Text style={styles.emptyText}>Add your delivery addresses for faster checkout</Text>
                        <TouchableOpacity
                            style={styles.addAddressBtn}
                            onPress={() => router.push('/profile/add-address' as never)}
                        >
                            <Text style={styles.addAddressBtnText}>Add New Address</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={addresses}
                        keyExtractor={(item) => item.id}
                        renderItem={renderAddress}
                        contentContainerStyle={styles.list}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: Colors.secondary
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
    addButton: { padding: 4 },

    scroll: { flex: 1 },
    list: { padding: 16, gap: 12 },

    addressCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
    },
    defaultBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    defaultText: { fontSize: 11, fontWeight: '700', color: '#166534' },
    addressContent: { flex: 1 },
    name: { fontSize: 15, fontWeight: '700', color: Colors.text },
    phone: { fontSize: 13, color: Colors.textLight, marginVertical: 4 },
    addressLine: { fontSize: 14, color: Colors.text, lineHeight: 20 },
    cityState: { fontSize: 13, color: Colors.textLight },

    actions: { justifyContent: 'space-between', paddingLeft: 12 },
    actionBtn: { padding: 8, marginVertical: 4 },

    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
    emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    addAddressBtn: {
        backgroundColor: Colors.secondary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    addAddressBtnText: { color: Colors.primary, fontWeight: '700' },

    loadingText: { textAlign: 'center', marginTop: 40, color: Colors.textLight },
});