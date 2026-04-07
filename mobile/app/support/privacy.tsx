// app/support/privacy.tsx
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { JSX } from 'react';
import { Colors } from '@/constants/colors';

export default function PrivacyScreen(): JSX.Element {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                {/* Last Updated */}
                <View style={styles.lastUpdatedContainer}>
                    <Text style={styles.lastUpdated}>
                        Last updated: {new Date().toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                    </Text>
                </View>

                <View style={styles.card}>

                    {/* Introduction */}
                    <Section title="Introduction">
                        <Text style={styles.paragraph}>
                            Karakata Market (“Karakata”, “we”, “our”, or “us”) respects your privacy and is committed to protecting your personal data.
                            This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.
                        </Text>
                        <Text style={styles.paragraph}>
                            By using Karakata Market, you agree to the collection and use of information in accordance with this policy.
                        </Text>
                    </Section>

                    {/* 1. Information We Collect */}
                    <Section title="1. Information We Collect">
                        <Text style={styles.paragraph}>
                            We may collect the following types of information:
                        </Text>
                        <BulletList items={[
                            "Name and contact information",
                            "Email address and phone number",
                            "Shipping and billing address",
                            "Account login details",
                            "Order history and transaction data",
                            "Device and browser information"
                        ]} />
                    </Section>

                    {/* 2. How We Use Your Information */}
                    <Section title="2. How We Use Your Information">
                        <Text style={styles.paragraph}>Your information helps us:</Text>
                        <BulletList items={[
                            "Process orders and payments",
                            "Deliver products through vendors and logistics partners",
                            "Provide customer support",
                            "Improve the platform and user experience",
                            "Send order updates and service notifications",
                            "Prevent fraud and maintain platform security"
                        ]} />
                    </Section>

                    {/* 3. Information Shared with Vendors */}
                    <Section title="3. Information Shared with Vendors">
                        <Text style={styles.paragraph}>
                            When you place an order on Karakata Market, your delivery information may be shared with the vendor responsible for fulfilling your order.
                        </Text>
                        <Text style={styles.paragraph}>
                            Vendors only receive the information necessary to process and deliver your order.
                        </Text>
                    </Section>

                    {/* 4. Payment Information */}
                    <Section title="4. Payment Information">
                        <Text style={styles.paragraph}>
                            Payments on Karakata Market are processed through secure third-party payment providers.
                            We do not store sensitive financial details such as debit or credit card numbers.
                        </Text>
                    </Section>

                    {/* 5. Cookies and Tracking Technologies */}
                    <Section title="5. Cookies and Tracking Technologies">
                        <Text style={styles.paragraph}>
                            Karakata Market uses cookies and similar technologies to:
                        </Text>
                        <BulletList items={[
                            "Keep users logged in",
                            "Improve site performance",
                            "Analyze user behavior",
                            "Personalize the shopping experience"
                        ]} />
                        <Text style={styles.paragraph}>
                            You can disable cookies through your browser settings, although some platform features may not function properly.
                        </Text>
                    </Section>

                    {/* 6. Data Security */}
                    <Section title="6. Data Security">
                        <Text style={styles.paragraph}>
                            We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, loss, misuse, or disclosure.
                        </Text>
                        <Text style={styles.paragraph}>
                            However, no online system is completely secure, and we cannot guarantee absolute security of your data.
                        </Text>
                    </Section>

                    {/* 7. Your Privacy Rights */}
                    <Section title="7. Your Privacy Rights">
                        <Text style={styles.paragraph}>You have the right to:</Text>
                        <BulletList items={[
                            "Access your personal data",
                            "Update or correct your information",
                            "Request deletion of your account",
                            "Opt out of marketing communications"
                        ]} />
                    </Section>

                    {/* 8. Changes to This Policy */}
                    <Section title="8. Changes to This Policy">
                        <Text style={styles.paragraph}>
                            Karakata Market may update this Privacy Policy periodically to reflect changes in our services, technology, or legal requirements.
                        </Text>
                        <Text style={styles.paragraph}>
                            Updated policies will be posted on this page with a revised “Last Updated” date.
                        </Text>
                    </Section>

                    {/* 9. Contact Us */}
                    <Section title="9. Contact Us">
                        <Text style={styles.paragraph}>If you have any questions about this Privacy Policy:</Text>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLine}>Email: contact@karakata.market</Text>
                            <Text style={styles.contactLine}>Phone: +234 802 688 8555</Text>
                            <Text style={styles.contactLine}>
                                Address: 2nd floor, Block A, Plot 1699 Sanusi Fafunwa St, Victoria Island 106104
                            </Text>
                        </View>
                    </Section>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Reusable Components
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const BulletList = ({ items }: { items: string[] }) => (
    <View style={styles.bulletList}>
        {items.map((item, index) => (
            <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
            </View>
        ))}
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
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },

    scroll: { flex: 1 },
    content: { padding: 16 },

    lastUpdatedContainer: { alignItems: 'center', marginBottom: 16 },
    lastUpdated: { fontSize: 13, color: Colors.textLight },

    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },

    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 14,
        color: Colors.textLight,
        lineHeight: 22,
        marginBottom: 12,
    },

    bulletList: { marginTop: 4 },
    bulletItem: { flexDirection: 'row', marginBottom: 6 },
    bullet: { marginRight: 8, color: Colors.textLight },
    bulletText: { flex: 1, fontSize: 14, color: Colors.textLight, lineHeight: 20 },

    contactInfo: { marginTop: 8 },
    contactLine: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 6,
    },
});