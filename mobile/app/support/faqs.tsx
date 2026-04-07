import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { JSX, useState } from 'react';
import { Colors } from '@/constants/colors';

const faqs = [
    {
        question: "How do I create an account?",
        answer:
            "Click on the Sign Up button at the top of the page and fill in your details. Once registered, you can start shopping immediately."
    },
    {
        question: "How do I place an order?",
        answer:
            "Browse products, add items to your cart, and proceed to checkout. Fill in your delivery details and complete the payment process."
    },
    {
        question: "How long does delivery take?",
        answer:
            "Delivery typically takes between 1–5 business days depending on your location and the vendor's processing time."
    },
    {
        question: "Can I return a product?",
        answer:
            "Yes. If a product is defective or not as described, you can request a return within 7 days of delivery."
    },
    {
        question: "How do vendors receive payments?",
        answer:
            "Vendors receive payouts directly to their registered bank account after an order has been successfully delivered."
    },
    {
        question: "How can I become a vendor?",
        answer:
            "Click on the 'Become a Vendor' link in the navigation menu and complete the vendor application form."
    },
    {
        question: "What payment methods are accepted?",
        answer:
            "We support debit cards, bank transfers, and secure online payments through our payment partners."
    },
    {
        question: "Who do I contact for support?",
        answer:
            "You can contact our support team through the Contact Us page or by emailing contact@karakata.market"
    }
];

export default function FAQsScreen(): JSX.Element {
    const router = useRouter();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
            </View>

            <ScrollView style={styles.scroll}>
                {faqs.map((faq, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.faqItem}
                        onPress={() => toggleFAQ(index)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.questionRow}>
                            <Text style={styles.question}>{faq.question}</Text>
                            {openIndex === index ? (
                                <ChevronUp size={20} color={Colors.primary} />
                            ) : (
                                <ChevronDown size={20} color={Colors.textLight} />
                            )}
                        </View>
                        {openIndex === index && (
                            <Text style={styles.answer}>{faq.answer}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.secondary },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
    scroll: { flex: 1, padding: 16 },
    faqItem: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    question: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 12 },
    answer: { marginTop: 12, fontSize: 14, color: Colors.textLight, lineHeight: 22 },
});