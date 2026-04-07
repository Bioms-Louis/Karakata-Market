import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JSX, useState } from 'react';

import { updateProfile, changePassword } from '@/src/api'; // You'll need to create these API functions
import { Colors } from '@/constants/colors';
import useAuthStore from '../../src/store/authStore';

interface ProfileForm {
    firstName: string;
    lastName: string;
}

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export default function ProfileSettingsScreen(): JSX.Element {
    const router = useRouter();
    const { user, updateUser } = useAuthStore();
    const qc = useQueryClient();

    const [isPasswordMode, setIsPasswordMode] = useState(false);

    // Profile Form
    const { control: profileControl, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileForm>({
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
        },
    });

    // Password Form
    const { control: passwordControl, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordForm>();

    // Update Profile Mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: ProfileForm) => updateProfile(data),
        onSuccess: (res) => {
            const updatedUser = res.data.data.user;
            updateUser(updatedUser);
            Alert.alert('Success', 'Profile updated successfully!');
            qc.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (e: any) => {
            Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
        },
    });

    // Change Password Mutation
    const changePasswordMutation = useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string }) => changePassword(data),
        onSuccess: () => {
            Alert.alert('Success', 'Password changed successfully!');
            resetPassword();
            setIsPasswordMode(false);
        },
        onError: (e: any) => {
            Alert.alert('Error', e.response?.data?.message || 'Failed to change password');
        },
    });

    const onUpdateProfile = (data: ProfileForm) => {
        updateProfileMutation.mutate(data);
    };

    const onChangePassword = (data: PasswordForm) => {
        if (data.newPassword !== data.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        changePasswordMutation.mutate({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Email (Non-editable) */}
                <View style={styles.infoCard}>
                    <Text style={styles.label}>Email Address</Text>
                    <Text style={styles.emailText}>{user?.email}</Text>
                    <Text style={styles.note}>Email cannot be changed</Text>
                </View>

                {/* Profile Information */}
                {!isPasswordMode && (
                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.field}>
                            <Text style={styles.label}>First Name</Text>
                            <Controller
                                control={profileControl}
                                name="firstName"
                                rules={{ required: 'First name is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, profileErrors.firstName && styles.inputError]}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Enter first name"
                                    />
                                )}
                            />
                            {profileErrors.firstName && <Text style={styles.errorText}>{profileErrors.firstName.message}</Text>}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Last Name</Text>
                            <Controller
                                control={profileControl}
                                name="lastName"
                                rules={{ required: 'Last name is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, profileErrors.lastName && styles.inputError]}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Enter last name"
                                    />
                                )}
                            />
                            {profileErrors.lastName && <Text style={styles.errorText}>{profileErrors.lastName.message}</Text>}
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleProfileSubmit(onUpdateProfile)}
                            disabled={updateProfileMutation.isPending}
                        >
                            {updateProfileMutation.isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Save size={18} color="#ffc70e" />
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Password Change Section */}
                <View style={styles.formCard}>
                    <TouchableOpacity
                        style={styles.passwordHeader}
                        onPress={() => setIsPasswordMode(!isPasswordMode)}
                    >
                        <Text style={styles.sectionTitle}>Change Password</Text>
                        <Text style={styles.toggleText}>
                            {isPasswordMode ? 'Cancel' : 'Update'}
                        </Text>
                    </TouchableOpacity>

                    {isPasswordMode && (
                        <View style={{ marginTop: 12 }}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Current Password</Text>
                                <Controller
                                    control={passwordControl}
                                    name="currentPassword"
                                    rules={{ required: 'Current password is required' }}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.input}
                                            value={value}
                                            onChangeText={onChange}
                                            secureTextEntry
                                            placeholder="Enter current password"
                                        />
                                    )}
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>New Password</Text>
                                <Controller
                                    control={passwordControl}
                                    name="newPassword"
                                    rules={{
                                        required: 'New password is required',
                                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                                    }}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.input}
                                            value={value}
                                            onChangeText={onChange}
                                            secureTextEntry
                                            placeholder="Enter new password"
                                        />
                                    )}
                                />
                                {passwordErrors.newPassword && <Text style={styles.errorText}>{passwordErrors.newPassword.message}</Text>}
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Confirm New Password</Text>
                                <Controller
                                    control={passwordControl}
                                    name="confirmPassword"
                                    rules={{ required: 'Please confirm new password' }}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.input}
                                            value={value}
                                            onChangeText={onChange}
                                            secureTextEntry
                                            placeholder="Confirm new password"
                                        />
                                    )}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: '#3c1a5b' }]}
                                onPress={handlePasswordSubmit(onChangePassword)}
                                disabled={changePasswordMutation.isPending}
                            >
                                {changePasswordMutation.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Change Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
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

    scrollContent: { padding: 16 },

    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    label: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 4 },
    emailText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
    note: { fontSize: 12, color: '#999', marginTop: 6, fontStyle: 'italic' },

    formCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
    field: { marginBottom: 16 },
    input: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        backgroundColor: Colors.background,
    },
    inputError: { borderColor: Colors.error },

    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleText: { color: Colors.primary, fontWeight: '600' },

    saveButton: {
        backgroundColor: Colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    saveButtonText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },

    errorText: { color: Colors.error, fontSize: 12, marginTop: 4 },
});