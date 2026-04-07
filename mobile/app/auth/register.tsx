import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import {JSX, useState } from 'react';
import { register as registerUser } from '../../src/api';
import useAuthStore from '../../src/store/authStore';
import { Colors } from '@/constants/colors';
import type { User } from '@/src/types';

interface RegisterForm {
    firstName:       string;
    lastName:        string;
    email:           string;
    password:        string;
    confirmPassword: string;
}

export default function RegisterScreen(): JSX.Element {
    const router    = useRouter();
    const authLogin = useAuthStore((s) => s.login);
    const [showPassword, setShowPassword] = useState(false);

    const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: (res) => {
            const apiData = res.data?.data;

            const token = apiData?.accessToken;
            const user = apiData?.user;

            if (!token || !user) {
                Alert.alert('Registration Error', 'Invalid response from server.');
                return;
            }

            authLogin(token, user)
                .then(() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(tabs)');
                    }
                });
        },
        onError: (e: any) => {
            Alert.alert(
                'Login Failed',
                e.response?.data?.message || 'Invalid email or password. Please try again.'
            );
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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join millions of shoppers on Karakata Market</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {(['firstName', 'lastName'] as const).map((name) => (
                                <View key={name} style={{ flex: 1 }}>
                                    <Text style={styles.label}>{name === 'firstName' ? 'First Name' : 'Last Name'}</Text>
                                    <Controller
                                        control={control} name={name}
                                        rules={{ required: 'Required' }}
                                        render={({ field: { onChange, value } }) => (
                                            <TextInput
                                                style={[styles.input, errors[name] && styles.inputError]}
                                                placeholder={name === 'firstName' ? 'John' : 'Doe'}
                                                placeholderTextColor={Colors.textLight}
                                                value={value} onChangeText={onChange}
                                            />
                                        )}
                                    />
                                    {errors[name] && <Text style={styles.error}>{errors[name]?.message}</Text>}
                                </View>
                            ))}
                        </View>

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
                                        keyboardType="email-address" autoCapitalize="none"
                                        value={value} onChangeText={onChange}
                                    />
                                )}
                            />
                            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Password</Text>
                            <Controller
                                control={control} name="password"
                                rules={{ required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } }}
                                render={({ field: { onChange, value } }) => (
                                    <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                                        <TextInput style={styles.inputFlex} placeholder="Min 8 characters"
                                                   placeholderTextColor={Colors.textLight}
                                                   secureTextEntry={!showPassword} value={value} onChangeText={onChange} />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={18} color={Colors.textLight} />
                                                : <Eye size={18} color={Colors.textLight} />}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <Controller
                                control={control} name="confirmPassword"
                                rules={{
                                    required: 'Please confirm password',
                                    validate: (v) => v === watch('password') || 'Passwords do not match',
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, errors.confirmPassword && styles.inputError]}
                                        placeholder="Repeat password" placeholderTextColor={Colors.textLight}
                                        secureTextEntry value={value} onChangeText={onChange} />
                                )}
                            />
                            {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}
                        </View>

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleSubmit((data) => registerMutation.mutate({
                                firstName: data.firstName,
                                lastName:  data.lastName,
                                email:     data.email,
                                password:  data.password,
                            }))}
                            disabled={registerMutation.isPending}
                            activeOpacity={0.85}
                        >
                            {registerMutation.isPending
                                ? <ActivityIndicator color={Colors.primary} />
                                : <Text style={styles.submitBtnText}>Create Account</Text>
                            }
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.replace('/auth/login' as never)}>
                                <Text style={styles.footerLink}>Sign in</Text>
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
    header:        { alignItems: 'center', marginTop: 16, marginBottom: 28 },
    logoBox:       { width: 70, height: 60, borderRadius: 18, backgroundColor: Colors.primary,
        alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    logoImage:     { width: 80, height: 80 },
    title:         { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 4 },
    subtitle:      { fontSize: 13, color: Colors.textLight },
    form:          { gap: 14 },
    field:         { gap: 5 },
    label:         { fontSize: 12, fontWeight: '700', color: Colors.text },
    input:         { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 13,
        fontSize: 14, color: Colors.text, backgroundColor: Colors.background },
    inputWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
        borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 8,
        paddingVertical: 6, backgroundColor: Colors.background },
    inputFlex:     { flex: 1, fontSize: 14, color: Colors.text },
    inputError:    { borderColor: Colors.error, backgroundColor: '#fff5f5' },
    error:         { fontSize: 11, color: Colors.error },
    submitBtn:     { backgroundColor: Colors.secondary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center', marginTop: 6 },
    submitBtnText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
    footer:        { flexDirection: 'row', justifyContent: 'center' },
    footerText:    { fontSize: 13, color: Colors.textLight },
    footerLink:    { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
