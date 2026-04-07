// app/support/terms.tsx
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

export default function TermsScreen(): JSX.Element {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
                            Welcome to Karakata Market. These Terms & Conditions govern your access to and use of the Karakata Market platform, including our website and services.
                        </Text>
                        <Text style={styles.paragraph}>
                            By accessing or using Karakata Market, you agree to comply with these terms. If you do not agree with any part of these terms, please do not use the platform.
                        </Text>
                    </Section>

                    {/* 1. About Karakata Market */}
                    <Section title="1. About Karakata Market">
                        <Text style={styles.paragraph}>
                            Karakata Market is an online marketplace that connects buyers with independent vendors selling products across various categories.
                        </Text>
                        <Text style={styles.paragraph}>
                            Karakata Market does not manufacture products listed on the platform and acts as an intermediary between vendors and customers.
                        </Text>
                    </Section>

                    {/* 2. User Accounts */}
                    <Section title="2. User Accounts">
                        <Text style={styles.paragraph}>
                            To access certain features of the platform, you may need to create an account.
                        </Text>
                        <BulletList items={[
                            "You must provide accurate information",
                            "You are responsible for maintaining account security",
                            "You must not share your login credentials",
                            "You must be at least 18 years old to create an account"
                        ]} />
                    </Section>

                    {/* 3. Orders & Purchases */}
                    <Section title="3. Orders & Purchases">
                        <Text style={styles.paragraph}>
                            When you place an order on Karakata Market, you agree to purchase the product at the listed price including applicable delivery charges and taxes.
                        </Text>
                        <Text style={styles.paragraph}>Orders may be cancelled if:</Text>
                        <BulletList items={[
                            "The product is unavailable",
                            "Payment verification fails",
                            "The order violates platform policies"
                        ]} />
                    </Section>

                    {/* 4. Payments */}
                    <Section title="4. Payments">
                        <Text style={styles.paragraph}>
                            Payments for purchases on Karakata Market must be made through approved payment methods provided on the platform.
                        </Text>
                        <Text style={styles.paragraph}>
                            All transactions are processed securely through authorized payment partners.
                        </Text>
                    </Section>

                    {/* 5. Shipping & Delivery */}
                    <Section title="5. Shipping & Delivery">
                        <Text style={styles.paragraph}>
                            Delivery timelines may vary depending on vendor location, shipping partner, and customer address.
                        </Text>
                        <Text style={styles.paragraph}>
                            Estimated delivery times are provided for convenience but are not guaranteed.
                        </Text>
                    </Section>

                    {/* 6. Returns & Refunds */}
                    <Section title="6. Returns & Refunds">
                        <Text style={styles.paragraph}>
                            Returns and refunds are governed by Karakata Market’s Return Policy.
                        </Text>
                        <Text style={styles.paragraph}>
                            Customers must submit return requests within the specified timeframe after receiving their order.
                        </Text>
                    </Section>

                    {/* 7. Vendor Responsibility */}
                    <Section title="7. Vendor Responsibility">
                        <Text style={styles.paragraph}>
                            Vendors are responsible for the products they list, including product descriptions, pricing, authenticity, and fulfillment of orders.
                        </Text>
                        <Text style={styles.paragraph}>
                            Karakata Market may remove listings that violate platform policies.
                        </Text>
                    </Section>

                    {/* 8. Prohibited Activities */}
                    <Section title="8. Prohibited Activities">
                        <Text style={styles.paragraph}>Users must not:</Text>
                        <BulletList items={[
                            "Use the platform for fraudulent purposes",
                            "Upload false or misleading information",
                            "Attempt to hack or disrupt the platform",
                            "Sell illegal or counterfeit products"
                        ]} />
                    </Section>

                    {/* 9. Account Suspension */}
                    <Section title="9. Account Suspension">
                        <Text style={styles.paragraph}>
                            Karakata Market reserves the right to suspend or terminate accounts that violate these Terms & Conditions.
                        </Text>
                    </Section>

                    {/* 10. Limitation of Liability */}
                    <Section title="10. Limitation of Liability">
                        <Text style={styles.paragraph}>
                            Karakata Market is not liable for damages arising from vendor products, delayed deliveries, or third-party services used on the platform.
                        </Text>
                    </Section>

                    {/* 11. Changes to These Terms */}
                    <Section title="11. Changes to These Terms">
                        <Text style={styles.paragraph}>
                            Karakata Market may update these Terms & Conditions periodically. Continued use of the platform indicates acceptance of the updated terms.
                        </Text>
                    </Section>

                    {/* 12. Contact Us */}
                    <Section title="12. Contact Us">
                        <Text style={styles.paragraph}>If you have questions regarding these Terms:</Text>
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

// Reusable Section Component
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