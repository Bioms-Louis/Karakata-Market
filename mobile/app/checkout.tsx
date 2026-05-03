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
import { ChevronLeft, MapPin, Phone, User, CreditCard, CheckCircle } from 'lucide-react-native';
import { JSX, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';

import { getCart, createOrder, getShippingFee, initializePayment, verifyPayment } from '@/src/api';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Colors } from '@/constants/colors';
import useAuthStore from '@/src/store/authStore';
import useCartStore from '@/src/store/cartStore';
import type { Cart, CartItem } from '@/src/types';

interface CheckoutForm {
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    notes?: string;
}

// Success Screen
const SuccessScreen = ({ orderNumber, onViewOrders }: {
    orderNumber: string;
    onViewOrders: () => void;
}): JSX.Element => (
    <View style={styles.successContainer}>
        <View style={styles.successIconWrap}>
            <CheckCircle size={56} color={Colors.success || '#22c55e'} />
        </View>
        <Text style={styles.successTitle}>Order Placed Successfully!</Text>
        <Text style={styles.successOrderNum}>Order #{orderNumber}</Text>
        <Text style={styles.successText}>
            Your order has been placed. You will be redirected to complete payment.
        </Text>
        <TouchableOpacity style={styles.viewOrdersBtn} onPress={onViewOrders}>
            <Text style={styles.viewOrdersBtnText}>View My Orders</Text>
        </TouchableOpacity>
    </View>
);

export default function CheckoutScreen(): JSX.Element {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore();
    const resetCart = useCartStore((s) => s.reset);

    const [isProcessing, setIsProcessing] = useState(false);
    const [successOrder, setSuccessOrder] = useState<{ id: string; order_number: string } | null>(null);

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

    const { data: cartData, isLoading: cartLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: getCart,
        select: (res) => res.data.data as Cart,
        enabled: isAuthenticated,
    });

    const { data: shippingFee = 1500 } = useQuery({
        queryKey: ['shipping-fee'],
        queryFn: getShippingFee,
        select: (res) => res.data.data.shippingFee as number,
    });

    const items = cartData?.items ?? [];
    const subtotal = cartData?.summary?.subtotal ?? 0;
    const total = subtotal + shippingFee;

    // Handle Payment Flow
    const handlePayment = async (shippingData: CheckoutForm) => {
        if (!shippingData.shippingName || !shippingData.shippingPhone || !shippingData.shippingAddress) {
            Alert.alert('Missing Information', 'Please fill in all required shipping details.');
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Create Order
            console.log('Creating order with data:', shippingData);
            const orderRes = await createOrder(shippingData);
            const order = orderRes.data?.data?.order || orderRes.data?.order;

            if (!order?.id) {
                throw new Error('Failed to create order. No order ID returned.');
            }

            console.log('Order created successfully:', order.id);

            // 2. Initialize Paystack Payment
            console.log('Initializing payment for order:', order.id);
            const payRes = await initializePayment({ orderId: order.id });
            const authorizationUrl = payRes.data?.data?.authorizationUrl || payRes.data?.authorizationUrl;

            if (!authorizationUrl) {
                console.error('No authorization URL returned:', payRes.data);
                throw new Error('Payment gateway did not return a payment URL. Please try again.');
            }

            console.log('Opening Paystack URL:', authorizationUrl);

            // 3. Open Paystack in WebBrowser (resolves when browser is dismissed)
            await WebBrowser.openBrowserAsync(authorizationUrl);

            // 4. Browser closed — verify payment status with backend
            console.log('Browser dismissed. Verifying payment for order:', order.order_number);
            try {
                const verifyRes = await verifyPayment(order.order_number);
                const paidOrder = verifyRes.data?.data?.order;

                if (paidOrder?.payment_status === 'paid') {
                    queryClient.invalidateQueries({ queryKey: ['cart'] });
                    queryClient.invalidateQueries({ queryKey: ['orders'] });
                    resetCart();

                    setSuccessOrder({
                        id: order.id,
                        order_number: order.order_number || order.id,
                    });
                } else {
                    Alert.alert(
                        'Payment Not Confirmed',
                        'Payment was not completed. Your order is saved — you can retry payment from your orders.',
                        [{ text: 'View Orders', onPress: () => router.replace('/(tabs)/orders') }]
                    );
                }
            } catch {
                // Verification failed — send user to orders to check status
                Alert.alert(
                    'Check Your Orders',
                    'Could not confirm payment status. Please check your orders.',
                    [{ text: 'View Orders', onPress: () => router.replace('/(tabs)/orders') }]
                );
            }
        } catch (err: any) {
            console.error('Checkout/Payment Error:', err.response?.data || err);
            Alert.alert(
                'Checkout Failed',
                err.response?.data?.message ||
                err.message ||
                'Something went wrong while processing your order. Please try again.'
            );
        } finally {
            setIsProcessing(false);
        }
    };

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

    if (successOrder) {
        return (
            <SafeAreaView style={styles.container}>
                <SuccessScreen
                    orderNumber={successOrder.order_number}
                    onViewOrders={() => router.replace('/(tabs)/orders' as never)}
                />
            </SafeAreaView>
        );
    }

    if (items.length === 0) {
        router.replace('/(tabs)/cart' as never);
        return <View />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Order Summary - unchanged */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                        {items.map((item: CartItem) => (
                            <View key={item.id} style={styles.summaryItem}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                    {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}
                                </Text>
                                <Text style={styles.itemQtyPrice}>
                                    {item.quantity} × {formatCurrency(item.unit_price)}
                                </Text>
                            </View>
                        ))}
                        <View style={styles.totalBreakdown}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Shipping</Text>
                                <Text style={styles.totalValue}>{formatCurrency(shippingFee)}</Text>
                            </View>
                            <View style={[styles.totalRow, styles.grandTotal]}>
                                <Text style={styles.grandTotalLabel}>Total</Text>
                                <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Shipping Form - unchanged */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Shipping Information</Text>

                        <Controller control={control} name="shippingName" rules={{ required: 'Full name is required' }}
                                    render={({ field: { onChange, value } }) => (
                                        <InputField label="Full Name" icon={User} placeholder="John Doe"
                                                    value={value} onChangeText={onChange} error={errors.shippingName?.message} />
                                    )} />

                        <Controller control={control} name="shippingPhone" rules={{ required: 'Phone number is required' }}
                                    render={({ field: { onChange, value } }) => (
                                        <InputField label="Phone Number" icon={Phone} placeholder="08012345678"
                                                    keyboardType="phone-pad" value={value} onChangeText={onChange}
                                                    error={errors.shippingPhone?.message} />
                                    )} />

                        <Controller control={control} name="shippingAddress" rules={{ required: 'Delivery address is required' }}
                                    render={({ field: { onChange, value } }) => (
                                        <InputField label="Delivery Address" icon={MapPin} placeholder="123 Example Street"
                                                    multiline value={value} onChangeText={onChange} error={errors.shippingAddress?.message} />
                                    )} />

                        <View style={styles.row}>
                            <Controller control={control} name="shippingCity" rules={{ required: 'City is required' }}
                                        render={({ field: { onChange, value } }) => (
                                            <InputField label="City" placeholder="Lagos" style={{ flex: 1 }}
                                                        value={value} onChangeText={onChange} error={errors.shippingCity?.message} />
                                        )} />
                            <Controller control={control} name="shippingState" rules={{ required: 'State is required' }}
                                        render={({ field: { onChange, value } }) => (
                                            <InputField label="State" placeholder="Lagos State" style={{ flex: 1, marginLeft: 12 }}
                                                        value={value} onChangeText={onChange} error={errors.shippingState?.message} />
                                        )} />
                        </View>

                        <Controller control={control} name="notes"
                                    render={({ field: { onChange, value } }) => (
                                        <InputField label="Additional Notes (Optional)"
                                                    placeholder="Any special delivery instructions..." multiline
                                                    value={value} onChangeText={onChange} />
                                    )} />
                    </View>
                </ScrollView>

                {/* Bottom Bar */}
                <View style={styles.bottomBar}>
                    <View>
                        <Text style={styles.bottomTotalLabel}>Total Amount</Text>
                        <Text style={styles.bottomTotal}>{formatCurrency(total)}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.payBtn, isProcessing && styles.payBtnDisabled]}
                        onPress={handleSubmit(handlePayment)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color={Colors.primary} />
                        ) : (
                            <>
                                <Text style={styles.payBtnText}>Proceed to Payment</Text>
                                <CreditCard size={20} color={Colors.primary} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Reusable Input Field
const InputField = ({ label, icon: Icon, error, style, ...props }: any): JSX.Element => (
    <View style={[styles.inputContainer, style]}>
        {label && <Text style={styles.inputLabel}>{label}</Text>}
        <View style={[styles.inputRow, error && styles.inputRowError]}>
            {Icon && <Icon size={18} color={error ? Colors.error : Colors.textLight} />}
            <TextInput style={styles.input} placeholderTextColor={Colors.textLight} {...props} />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.secondary },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },
    scrollContent: { padding: 16, paddingBottom: 110 },
    section: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, color: Colors.text },
    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    itemName: { flex: 1, fontSize: 13, color: Colors.text },
    itemQtyPrice: { fontSize: 12, color: Colors.textLight },
    totalBreakdown: { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalLabel: { fontSize: 13, color: Colors.textLight },
    totalValue: { fontSize: 13, fontWeight: '600' },
    grandTotal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
    grandTotalLabel: { fontSize: 15, fontWeight: '800' },
    grandTotalValue: { fontSize: 17, fontWeight: '900', color: Colors.secondary },
    row: { flexDirection: 'row' },
    inputContainer: { marginBottom: 14 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 6 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fafafa' },
    inputRowError: { borderColor: Colors.error },
    input: { flex: 1, fontSize: 14, color: Colors.text },
    errorText: { fontSize: 11, color: Colors.error, marginTop: 4 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bottomTotalLabel: { fontSize: 12, color: Colors.textLight },
    bottomTotal: { fontSize: 20, fontWeight: '900', color: Colors.secondary },
    payBtn: { backgroundColor: Colors.secondary, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14 },
    payBtnDisabled: { opacity: 0.6 },
    payBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 16 },
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    successIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 8 },
    successOrderNum: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
    successText: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    viewOrdersBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
    viewOrdersBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 15 },
});