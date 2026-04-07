import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    User, Package, Heart, LogOut, ChevronRight,
    HelpCircle, FileText, Shield, Settings, Phone, MapPin,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import useAuthStore from '../../src/store/authStore';
import { JSX } from "react";

interface MenuItemProps {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    onPress: () => void;
    danger?: boolean;
}

const MenuItem = ({ icon: Icon, label, onPress, danger = false }: MenuItemProps): JSX.Element => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
            <Icon size={18} color={danger ? Colors.error : Colors.primary} />
        </View>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        <ChevronRight size={16} color={Colors.textLight} />
    </TouchableOpacity>
);

export default function ProfileScreen(): JSX.Element {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();

    const handleLogout = (): void => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => void logout() },
        ]);
    };

    // Navigate to Profile Settings
    const goToProfileSettings = () => {
        router.push('/profile/settings' as never);   // We'll create this screen next if needed
    };

    if (!isAuthenticated || !user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}><Text style={styles.headerTitle}>My Profile</Text></View>
                <View style={styles.guestContainer}>
                    <View style={styles.guestAvatar}>
                        <User size={40} color={Colors.primary} opacity={0.7} />
                    </View>
                    <Text style={styles.guestTitle}>Welcome to Karakata Market!</Text>
                    <Text style={styles.guestText}>Sign in to access your orders, wishlist and more</Text>
                    <TouchableOpacity style={styles.signInBtn}
                                      onPress={() => router.push('/auth/login' as never)}>
                        <Text style={styles.signInBtnText}>Sign In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.registerBtn}
                                      onPress={() => router.push('/auth/register' as never)}>
                        <Text style={styles.registerBtnText}>Create Account</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* User Card */}
                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.first_name?.[0]?.toUpperCase() ?? user?.last_name?.[0]?.toUpperCase() ?? 'U'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                        {user?.role && (
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Profile Settings - New Section */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Profile Settings</Text>
                    <MenuItem
                        icon={Settings}
                        label="Edit Profile"
                        onPress={goToProfileSettings}
                    />
                    <MenuItem
                        icon={Phone}
                        label="Phone Number"
                        onPress={() => router.push('/profile/phone' as never)}
                    />
                    <MenuItem
                        icon={MapPin}
                        label="Addresses"
                        onPress={() => router.push('/profile/addresses' as never)}
                    />
                </View>

                {/* Account Section */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Account</Text>
                    <MenuItem icon={Package} label="My Orders"
                              onPress={() => router.push('/(tabs)/orders' as never)} />
                    <MenuItem icon={Heart} label="My Wishlist"
                              onPress={() => router.push('/wishlist' as never)} />
                </View>

                {/* Support Section */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Support</Text>
                    <MenuItem icon={HelpCircle} label="FAQs" onPress={() => Alert.alert('Coming Soon', 'FAQs will be available soon')} />
                    <MenuItem icon={FileText} label="Terms & Conditions" onPress={() => Alert.alert('Coming Soon')} />
                    <MenuItem icon={Shield} label="Privacy Policy" onPress={() => Alert.alert('Coming Soon')} />
                </View>

                {/* Logout */}
                <View style={styles.menuSection}>
                    <MenuItem icon={LogOut} label="Log Out" onPress={handleLogout} danger />
                </View>

                <Text style={styles.version}>Karakata Market v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:        { flex: 1, backgroundColor: Colors.background },
    header:           { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.secondary },
    headerTitle:      { fontSize: 20, fontWeight: '800', color: Colors.primary },

    guestContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    guestAvatar:      { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f5f0fa',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    guestTitle:       { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    guestText:        { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginBottom: 24 },
    signInBtn:        { width: '100%', backgroundColor: Colors.secondary, paddingVertical: 14,
        borderRadius: 14, alignItems: 'center', marginBottom: 10 },
    signInBtnText:    { color: Colors.primary, fontWeight: '800', fontSize: 15 },
    registerBtn:      { width: '100%', borderWidth: 2, borderColor: Colors.primary,
        paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    registerBtnText:  { color: Colors.primary, fontWeight: '800', fontSize: 15 },

    userCard:         { flexDirection: 'row', alignItems: 'center', gap: 14, margin: 16,
        backgroundColor: Colors.white, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: Colors.border },
    avatar:           { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
        alignItems: 'center', justifyContent: 'center' },
    avatarText:       { fontSize: 22, fontWeight: '900', color: Colors.secondary },
    userInfo:         { flex: 1 },
    userName:         { fontSize: 14, fontWeight: '800', color: Colors.textLight },
    userEmail:        { fontSize: 13, color: Colors.textLight, marginVertical: 4 },
    roleBadge:        { alignSelf: 'flex-start', backgroundColor: Colors.secondary,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    roleText:         { fontSize: 11, fontWeight: '700', color: Colors.primary },

    menuSection:      { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 12,
        borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    menuSectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textLight,
        textTransform: 'uppercase', letterSpacing: 0.8,
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
    menuItem:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
        paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border },
    menuIcon:         { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f0fa',
        alignItems: 'center', justifyContent: 'center' },
    menuIconDanger:   { backgroundColor: '#fee2e2' },
    menuLabel:        { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
    menuLabelDanger:  { color: Colors.error },
    version:          { textAlign: 'center', fontSize: 11, color: Colors.textLight, paddingVertical: 24, marginBottom: 24 },
});