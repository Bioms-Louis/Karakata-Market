import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Save } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JSX, useState } from 'react';

import { updatePhone } from '@/src/api'; // Create this API function
import { Colors } from '@/constants/colors';
import useAuthStore from '../../src/store/authStore';

interface PhoneForm {
    phoneNumber: string;
}

export default function PhoneNumberScreen(): JSX.Element {
    const router = useRouter();
    const { user, updateUser } = useAuthStore();
    const qc = useQueryClient();

    const { control, handleSubmit, formState: { errors } } = useForm<PhoneForm>({
        defaultValues: {
            phoneNumber: user?.phoneNumber || '',
        },
    });

    const updatePhoneMutation = useMutation({
        mutationFn: (data: PhoneForm) => updatePhone(data),
        onSuccess: (res) => {
            const updatedUser = res.data.data.user;
            updateUser(updatedUser);
            Alert.alert('Success', 'Phone number updated successfully!');
            qc.invalidateQueries({ queryKey: ['user'] });
            router.back();
        },
        onError: (e: any) => {
            Alert.alert('Error', e.response?.data?.message || 'Failed to update phone number');
        },
    });

    const onSubmit = (data: PhoneForm) => {
        if (!data.phoneNumber || data.phoneNumber.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }
        updatePhoneMutation.mutate(data);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Phone Number</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Phone size={40} color={Colors.primary} />
                    </View>

                    <Text style={styles.title}>Your Phone Number</Text>
                    <Text style={styles.subtitle}>
                        This will be used for order updates and delivery contact
                    </Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Phone Number</Text>
                        <Controller
                            control={control}
                            name="phoneNumber"
                            rules={{
                                required: 'Phone number is required',
                                minLength: { value: 10, message: 'Phone number must be at least 10 digits' }
                            }}
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    style={[styles.input, errors.phoneNumber && styles.inputError]}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="08012345678"
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                />
                            )}
                        />
                        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>}
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSubmit(onSubmit)}
                        disabled={updatePhoneMutation.isPending}
                    >
                        {updatePhoneMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Save size={18} color="#ffc70e" />
                                <Text style={styles.saveButtonText}>Save Phone Number</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.note}>
                        * Your phone number is private and will only be used for delivery and order communication.
                    </Text>
                </View>
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

    scroll: { flex: 1 },
    scrollContent: { padding: 16 },

    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f5f0fa',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    subtitle: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginBottom: 24 },

    field: { width: '100%', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 6 },
    input: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: Colors.background,
    },
    inputError: { borderColor: Colors.error },

    saveButton: {
        backgroundColor: Colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        marginTop: 10,
    },
    saveButtonText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },

    errorText: { color: Colors.error, fontSize: 12, marginTop: 4 },
    note: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 20, lineHeight: 18 },
});