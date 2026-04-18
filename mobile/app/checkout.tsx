import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { ChevronLeft, MapPin, Phone, User, CreditCard, ArrowRight } from 'lucide-react-native';
import { JSX, useState } from 'react';

import { getCart, createOrder, getShippingFee } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '@/src/store/authStore';
import type { Cart, CartItem } from '@/src/types';

interface CheckoutForm {
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    notes?: string;
}

export default function CheckoutScreen(): JSX.Element {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore();

    const [isProcessing, setIsProcessing] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
        defaultValues: {
            shippingName: '',
            shippingPhone: '',
            shippingAddress: '',
            shippingCity: '',
            shippingState: '',
            notes: '',
        },
    });

    // Fetch Cart
    const { data: cartData, isLoading: cartLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: getCart,
        select: (res) => res.data.data as Cart,
        enabled: isAuthenticated,
    });

    // Fetch Shipping Fee
    const { data: shippingFee = 1500 } = useQuery({
        queryKey: ['shipping-fee'],
        queryFn: getShippingFee,
        select: (res) => res.data.data.shippingFee as number,
    });

    const createOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (res) => {
            const order = res.data.data.order; // adjust based on your actual response
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            Alert.alert(
                'Order Placed Successfully!',
                `Your order #${order?.id || ''} has been placed.`,
                [{ text: 'View Orders', onPress: () => router.push('/orders') }]
            );
            router.replace('/orders'); // or wherever you want to redirect
        },
        onError: (error: any) => {
            Alert.alert(
                'Checkout Failed',
                error.response?.data?.message || 'Something went wrong. Please try again.'
            );
        },
        onSettled: () => setIsProcessing(false),
    });

    const items = cartData?.items ?? [];
    const subtotal = cartData?.summary?.subtotal ?? 0;
    const total = subtotal + shippingFee;

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                </View>
                <View style={styles.center}>
                    <Text style={styles.emptyTitle}>Please sign in to checkout</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth/login' as never)}>
                        <Text style={styles.btnText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (cartLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    if (items.length === 0) {
        router.replace('/cart');
        return null;
    }

    const onSubmit = (data: CheckoutForm) => {
        setIsProcessing(true);
        createOrderMutation.mutate(data);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Order Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                        {items.map((item: CartItem) => (
                            <View key={item.id} style={styles.summaryItem}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                    {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}
                                </Text>
                                <Text style={styles.itemQtyPrice}>
                                    {item.quantity} × {formatCurrency(item.unit_price)} ={' '}
                                    {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
                                </Text>
                            </View>
                        ))}

                        <View style={styles.totalBreakdown}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Shipping Fee</Text>
                                <Text style={styles.totalValue}>{formatCurrency(shippingFee)}</Text>
                            </View>
                            <View style={[styles.totalRow, styles.grandTotal]}>
                                <Text style={styles.grandTotalLabel}>Total</Text>
                                <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Shipping Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Shipping Information</Text>

                        <Controller
                            control={control}
                            name="shippingName"
                            rules={{ required: 'Full name is required' }}
                            render={({ field: { onChange, value } }) => (
                                <InputField
                                    label="Full Name"
                                    icon={User}
                                    placeholder="John Doe"
                                    value={value}
                                    onChangeText={onChange}
                                    error={errors.shippingName?.message}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="shippingPhone"
                            rules={{ required: 'Phone number is required' }}
                            render={({ field: { onChange, value } }) => (
                                <InputField
                                    label="Phone Number"
                                    icon={Phone}
                                    placeholder="08012345678"
                                    keyboardType="phone-pad"
                                    value={value}
                                    onChangeText={onChange}
                                    error={errors.shippingPhone?.message}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="shippingAddress"
                            rules={{ required: 'Delivery address is required' }}
                            render={({ field: { onChange, value } }) => (
                                <InputField
                                    label="Delivery Address"
                                    icon={MapPin}
                                    placeholder="123 Example Street"
                                    multiline
                                    value={value}
                                    onChangeText={onChange}
                                    error={errors.shippingAddress?.message}
                                />
                            )}
                        />

                        <View style={styles.row}>
                            <Controller
                                control={control}
                                name="shippingCity"
                                rules={{ required: 'City is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <InputField
                                        label="City"
                                        placeholder="Lagos"
                                        style={{ flex: 1 }}
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.shippingCity?.message}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="shippingState"
                                rules={{ required: 'State is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <InputField
                                        label="State"
                                        placeholder="Lagos"
                                        style={{ flex: 1, marginLeft: 12 }}
                                        value={value}
                                        onChangeText={onChange}
                                        error={errors.shippingState?.message}
                                    />
                                )}
                            />
                        </View>

                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, value } }) => (
                                <InputField
                                    label="Additional Notes (Optional)"
                                    placeholder="Any special delivery instructions..."
                                    multiline
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
                    </View>
                </ScrollView>

                {/* Fixed Bottom Bar */}
                <View style={styles.bottomBar}>
                    <View>
                        <Text style={styles.bottomTotalLabel}>Total Amount</Text>
                        <Text style={styles.bottomTotal}>{formatCurrency(total)}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.payBtn}
                        onPress={handleSubmit(onSubmit)}
                        disabled={createOrderMutation.isPending || isProcessing}
                    >
                        {createOrderMutation.isPending || isProcessing ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <>
                                <Text style={styles.payBtnText}>Place Order</Text>
                                <CreditCard size={20} color={Colors.primary} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Reusable Input Field Component
const InputField = ({
                        label,
                        icon: Icon,
                        error,
                        style,
                        ...props
                    }: any) => (
    <View style={[styles.inputContainer, style]}>
        {label && <Text style={styles.inputLabel}>{label}</Text>}
        <View style={[styles.inputRow, error && styles.inputRowError]}>
            {Icon && <Icon size={18} color={error ? Colors.error : Colors.textLight} />}
            <TextInput
                style={styles.input}
                placeholderTextColor={Colors.textLight}
                {...props}
            />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: Colors.secondary,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
    scrollContent: { padding: 16, paddingBottom: 100 },
    section: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: Colors.text },

    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    itemName: { flex: 1, fontSize: 14, color: Colors.text },
    itemQtyPrice: { fontSize: 13, color: Colors.textLight },

    totalBreakdown: { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalLabel: { fontSize: 14, color: Colors.textLight },
    totalValue: { fontSize: 14, fontWeight: '600' },
    grandTotal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
    grandTotalLabel: { fontSize: 16, fontWeight: '700' },
    grandTotalValue: { fontSize: 18, fontWeight: '900', color: Colors.secondary },

    row: { flexDirection: 'row' },

    inputContainer: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#fafafa',
    },
    inputRowError: { borderColor: Colors.error },
    input: { flex: 1, fontSize: 15, color: Colors.text },
    errorText: { fontSize: 12, color: Colors.error, marginTop: 4 },

    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bottomTotalLabel: { fontSize: 13, color: Colors.textLight },
    bottomTotal: { fontSize: 20, fontWeight: '900', color: Colors.secondary },
    payBtn: {
        backgroundColor: Colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 14,
    },
    payBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 16 },
    btn: { backgroundColor: Colors.secondary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    btnText: { color: Colors.primary, fontWeight: '800', fontSize: 15 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
});