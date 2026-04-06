import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import {JSX, useState } from 'react';
import { login } from '@/src/api';
import useAuthStore from '../../src/store/authStore';
import { Colors } from '@/constants/colors';
import type { User } from '@/src/types';

interface LoginForm {
    email:    string;
    password: string;
}

export default function LoginScreen(): JSX.Element {
    const router    = useRouter();
    const authLogin = useAuthStore((s) => s.login);
    const [showPassword, setShowPassword] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>();

    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: (res) => {
            const { token, user } = res.data.data as { token: string; user: User };
            void authLogin(token, user);
            router.replace('/(tabs)' as never);
        },
        onError: (e: any) => {
            alert(e.response?.data?.message ?? 'Login failed. Please try again.');
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                  style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <View style={styles.logoBox}>
                            <Image
                                source={require('../../assets/images/Logo-purple.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to your Karakata Market Account</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.field}>
                            <Text style={styles.label}>Email Address</Text>
                            <Controller
                                control={control} name="email"
                                rules={{
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, errors.email && styles.inputError]}
                                        placeholder="you@example.com"
                                        placeholderTextColor={Colors.textLight}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />
                            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Password</Text>
                            <Controller
                                control={control} name="password"
                                rules={{ required: 'Password is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                                        <TextInput
                                            style={styles.inputFlex}
                                            placeholder="Your password"
                                            placeholderTextColor={Colors.textLight}
                                            secureTextEntry={!showPassword}
                                            value={value}
                                            onChangeText={onChange}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            {showPassword
                                                ? <EyeOff size={18} color={Colors.textLight} />
                                                : <Eye size={18} color={Colors.textLight} />
                                            }
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                        </View>

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleSubmit((data) => loginMutation.mutate(data))}
                            disabled={loginMutation.isPending}
                            activeOpacity={0.85}
                        >
                            {loginMutation.isPending
                                ? <ActivityIndicator color={Colors.primary} />
                                : <Text style={styles.submitBtnText}>Sign In</Text>
                            }
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.replace('/auth/register' as never)}>
                                <Text style={styles.footerLink}>Create one</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: Colors.white },
    scroll:        { flexGrow: 1, padding: 24 },
    header:        { alignItems: 'center', marginTop: 20, marginBottom: 36 },
    logoBox:       { width: 70, height: 60, borderRadius: 20, backgroundColor: Colors.primary,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    logoImage:     { width: 80, height: 80 },
    title:         { fontSize: 26, fontWeight: '900', color: Colors.text, marginBottom: 6 },
    subtitle:      { fontSize: 14, color: Colors.textLight },
    form:          { gap: 16 },
    field:         { gap: 6 },
    label:         { fontSize: 13, fontWeight: '700', color: Colors.text },
    input:         { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 13,
        fontSize: 14, color: Colors.text, backgroundColor: Colors.background },
    inputWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
        borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 8,
        paddingVertical: 6, backgroundColor: Colors.background },
    inputFlex:     { flex: 1, fontSize: 14, color: Colors.text },
    inputError:    { borderColor: Colors.error, backgroundColor: '#fff5f5' },
    error:         { fontSize: 11, color: Colors.error, marginTop: 2 },
    submitBtn:     { backgroundColor: Colors.secondary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    submitBtnText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
    footer:        { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
    footerText:    { fontSize: 13, color: Colors.textLight },
    footerLink:    { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
