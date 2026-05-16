import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { ChevronLeft, User, Mail, Phone, Save, Lock } from 'lucide-react-native';
import { JSX, useEffect } from 'react';
import { getMyProfile, updateMyProfile } from '@/src/api';
import useAuthStore from '@/src/store/authStore';
import { Colors } from '@/constants/colors';
import type { User as UserType } from '@/src/types';

interface ProfileForm {
    firstName: string;
    lastName: string;
    phone: string;
}

const Field = ({
                   label, icon: Icon, error, children, disabled = false,
               }: {
    label: string;
    icon: React.ComponentType<{ size: number; color: string }>;
    error?: string;
    children: JSX.Element;
    disabled?: boolean;
}): JSX.Element => (
    <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <View style={[
            styles.inputRow,
            !!error && styles.inputRowError,
            disabled && styles.inputRowDisabled
        ]}>
            <Icon size={16} color={disabled ? '#999' : (error ? Colors.error : Colors.textLight)} />
            {children}
            {disabled && <Lock size={16} color="#999" style={{ marginLeft: 8 }} />}
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

export default function EditProfileScreen(): JSX.Element {
    const router = useRouter();
    const qc = useQueryClient();
    const { updateUser } = useAuthStore();

    const { control, handleSubmit, reset, formState: { errors, isDirty } } =
        useForm<ProfileForm>();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['my-profile'],
        queryFn: getMyProfile,
        select: (res) => res.data.data.user as UserType,
    });

    // Pre-fill form when data loads
    useEffect(() => {
        if (profile) {
            reset({
                firstName: profile.first_name ?? '',
                lastName: profile.last_name ?? '',
                phone: profile.phone ?? '',
            });
        }
    }, [profile, reset]);

    const updateMutation = useMutation({
        mutationFn: (data: ProfileForm) => updateMyProfile(data),
        onSuccess: (res) => {
            const updated = res.data.data.user as UserType;
            qc.setQueryData(['my-profile'], (old: any) => ({
                ...old,
                data: { ...old?.data, data: { user: updated } },
            }));
            updateUser(updated);
            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        },
        onError: (e: any) => {
            Alert.alert('Error', e.response?.data?.message ?? 'Failed to update profile.');
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 38 }} />
            </View>

            {isLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} size="large" />
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scroll}
                                keyboardShouldPersistTaps="handled">

                        {/* Avatar initial */}
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {profile?.first_name?.[0]?.toUpperCase() ?? 'U'}
                                </Text>
                            </View>
                            <Text style={styles.avatarHint}>
                                {profile?.first_name} {profile?.last_name}
                            </Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardRow}>
                                <View style={{ flex: 1 }}>
                                    <Field label="First Name" icon={User}
                                           error={errors.firstName?.message}>
                                        <Controller
                                            control={control} name="firstName"
                                            render={({ field: { onChange, value } }) => (
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="John"
                                                    placeholderTextColor={Colors.textLight}
                                                    value={value}
                                                    onChangeText={onChange}
                                                />
                                            )}
                                        />
                                    </Field>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Field label="Last Name" icon={User}
                                           error={errors.lastName?.message}>
                                        <Controller
                                            control={control} name="lastName"
                                            render={({ field: { onChange, value } }) => (
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Doe"
                                                    placeholderTextColor={Colors.textLight}
                                                    value={value}
                                                    onChangeText={onChange}
                                                />
                                            )}
                                        />
                                    </Field>
                                </View>
                            </View>

                            {/* Email - Read Only */}
                            <Field label="Email Address" icon={Mail} disabled>
                                <TextInput
                                    style={[styles.input, styles.disabledInput]}
                                    value={profile?.email ?? ''}
                                    editable={false}
                                    selectTextOnFocus={false}
                                />
                            </Field>

                            <Field label="Phone Number" icon={Phone}>
                                <Controller
                                    control={control} name="phone"
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.input}
                                            placeholder="08012345678"
                                            placeholderTextColor={Colors.textLight}
                                            keyboardType="phone-pad"
                                            value={value}
                                            onChangeText={onChange}
                                        />
                                    )}
                                />
                            </Field>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, (!isDirty || updateMutation.isPending)
                            && styles.saveBtnDisabled]}
                            onPress={handleSubmit((data) => updateMutation.mutate(data))}
                            disabled={!isDirty || updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <ActivityIndicator color={Colors.primary} />
                            ) : (
                                <>
                                    <Save size={18} color={Colors.primary} />
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: Colors.background },
    header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: Colors.secondary },
    backBtn:         { padding: 4 },
    headerTitle:     { fontSize: 17, fontWeight: '800', color: Colors.primary },
    scroll:          { padding: 16, gap: 16, paddingBottom: 40 },
    avatarContainer: { alignItems: 'center', marginVertical: 8 },
    avatar:          { width: 72, height: 72, borderRadius: 36,
        backgroundColor: Colors.primary, alignItems: 'center',
        justifyContent: 'center', marginBottom: 8 },
    avatarText:      { fontSize: 28, fontWeight: '900', color: Colors.secondary },
    avatarHint:      { fontSize: 14, color: Colors.textLight },
    card:            { backgroundColor: Colors.white, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: Colors.border, gap: 4 },
    cardRow:         { flexDirection: 'row', gap: 12 },
    field:           { marginBottom: 14 },
    label:           { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    inputRow:        { flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 11,
        backgroundColor: '#fafafa' },
    inputRowError:   { borderColor: Colors.error, backgroundColor: '#fff5f5' },
    inputRowDisabled: { backgroundColor: '#f5f5f5', borderColor: '#e5e5e5' },
    input:           { flex: 1, fontSize: 14, color: Colors.text },
    disabledInput:   { color: '#999', backgroundColor: 'transparent' },
    errorText:       { fontSize: 11, color: Colors.error, marginTop: 4 },
    saveBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: Colors.secondary, borderRadius: 14,
        paddingVertical: 16 },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText:     { fontSize: 15, fontWeight: '800', color: Colors.primary },
});