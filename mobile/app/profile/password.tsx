import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { ChevronLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react-native';
import { JSX, useState } from 'react';
import { changeMyPassword } from '@/src/api';
import { Colors } from '@/constants/colors';

interface PasswordForm {
    currentPassword:  string;
    newPassword:      string;
    confirmPassword:  string;
}

export default function ChangePasswordScreen(): JSX.Element {
    const router = useRouter();
    const [show, setShow] = useState({ current: false, newPw: false, confirm: false });

    const { control, handleSubmit, watch, reset, formState: { errors } } =
        useForm<PasswordForm>();

    const mutation = useMutation({
        mutationFn: changeMyPassword,
        onSuccess: () => {
            reset();
            Alert.alert(
                'Password Changed',
                'Your password has been updated successfully.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        },
        onError: (e: any) => {
            Alert.alert('Error', e.response?.data?.message ?? 'Failed to change password.');
        },
    });

    const PasswordField = ({
                               name, label, showKey, placeholder,
                           }: {
        name: keyof PasswordForm;
        label: string;
        showKey: keyof typeof show;
        placeholder: string;
    }): JSX.Element => (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputRow, !!errors[name] && styles.inputRowError]}>
                <Lock size={16} color={errors[name] ? Colors.error : Colors.textLight} />
                <Controller
                    control={control}
                    name={name}
                    rules={{
                        required: `${label} is required`,
                        ...(name === 'newPassword' && {
                            minLength: { value: 8, message: 'Min 8 characters' },
                        }),
                        ...(name === 'confirmPassword' && {
                            validate: (v) => v === watch('newPassword') || 'Passwords do not match',
                        }),
                    }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor={Colors.textLight}
                            secureTextEntry={!show[showKey]}
                            value={value}
                            onChangeText={onChange}
                        />
                    )}
                />
                <TouchableOpacity onPress={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}>
                    {show[showKey]
                        ? <EyeOff size={18} color={Colors.textLight} />
                        : <Eye size={18} color={Colors.textLight} />
                    }
                </TouchableOpacity>
            </View>
            {errors[name] && <Text style={styles.errorText}>{errors[name]?.message}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 38 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}
                            keyboardShouldPersistTaps="handled">

                    {/* Icon banner */}
                    <View style={styles.banner}>
                        <View style={styles.bannerIcon}>
                            <ShieldCheck size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.bannerTitle}>Keep your account secure</Text>
                        <Text style={styles.bannerText}>
                            Choose a strong password with at least 8 characters.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <PasswordField
                            name="currentPassword"
                            label="Current Password"
                            showKey="current"
                            placeholder="Your current password"
                        />
                        <PasswordField
                            name="newPassword"
                            label="New Password"
                            showKey="newPw"
                            placeholder="Min 8 characters"
                        />
                        <PasswordField
                            name="confirmPassword"
                            label="Confirm New Password"
                            showKey="confirm"
                            placeholder="Repeat new password"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, mutation.isPending && styles.saveBtnDisabled]}
                        onPress={handleSubmit((data) => mutation.mutate({
                            currentPassword: data.currentPassword,
                            newPassword:     data.newPassword,
                        }))}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending
                            ? <ActivityIndicator color={Colors.primary} />
                            : <Text style={styles.saveBtnText}>Update Password</Text>
                        }
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: Colors.background },
    header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.secondary },
    backBtn:        { padding: 4 },
    headerTitle:    { fontSize: 17, fontWeight: '800', color: Colors.primary },
    scroll:         { padding: 16, gap: 16, paddingBottom: 40 },
    banner:         { alignItems: 'center', paddingVertical: 8 },
    bannerIcon:     { width: 68, height: 68, borderRadius: 34, backgroundColor: '#f5f0fa',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    bannerTitle:    { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    bannerText:     { fontSize: 13, color: Colors.textLight, textAlign: 'center' },
    card:           { backgroundColor: Colors.white, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: Colors.border },
    field:          { marginBottom: 14 },
    label:          { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    inputRow:       { flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#fafafa' },
    inputRowError:  { borderColor: Colors.error, backgroundColor: '#fff5f5' },
    input:          { flex: 1, fontSize: 14, color: Colors.text },
    errorText:      { fontSize: 11, color: Colors.error, marginTop: 4 },
    saveBtn:        { backgroundColor: Colors.secondary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center' },
    saveBtnDisabled:{ opacity: 0.5 },
    saveBtnText:    { fontSize: 15, fontWeight: '800', color: Colors.primary },
});
