import React, { useState, useContext } from 'react'; // Import useContext
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext'; // Import ThemeContext

export default function HelpCenter() {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme and colors

  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqData = [
    {
      question: "How do I request a ride to move my items?",
      answer: "On the home screen, enter pickup and drop-off locations, select item size, and confirm booking."
    },
    {
      question: "What types of items can I transport?",
      answer: "You may transport furniture, electronics, boxes, and other personal belongings. Dangerous goods are not allowed."
    },
    {
      question: "How are prices calculated?",
      answer: "Pricing is based on distance, vehicle size, and weight category. A full quote will appear before you confirm."
    },
    {
      question: "Can I schedule a move in advance?",
      answer: "Yes! You can choose a future date and time when booking your ride."
    },
    {
      question: "How do I communicate with the driver?",
      answer: "Once your ride is confirmed, the driver’s contact info becomes available."
    }
  ];

  const packingTips = [
    "Wrap fragile items with bubble wrap or towels.",
    "Label boxes clearly (e.g., Kitchen, Fragile, Electronics).",
    "Disassemble large furniture if possible.",
    "Place heavy items in small boxes for easier lifting.",
    "Use blankets to protect furniture from scratches."
  ];

  const toggleFAQ = (index) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@lubadelivery.com?subject=Support Request&body=Hello, I need help with...');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}> {/* Apply background color to SafeAreaView */}
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}> {/* Apply background color */}
        <Text style={[styles.title, { color: colors.iconRed }]}>Help Center</Text> {/* Apply text color */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Find answers, tips, and support below.</Text> {/* Apply text color */}

        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>Frequently Asked Questions</Text> {/* Apply text color */}
        {faqData.map((item, index) => (
          <View key={index} style={[styles.faqBox, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}> {/* Apply background and border color */}
            <TouchableOpacity onPress={() => toggleFAQ(index)} style={styles.faqHeader}>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.iconRed} // Icon color
              />
              <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text> {/* Apply text color */}
            </TouchableOpacity>
            {expandedIndex === index && (
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.answer}</Text> /* Apply text color */
            )}
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>Packing Tips</Text> {/* Apply text color */}
        {packingTips.map((tip, idx) => (
          <View key={idx} style={[styles.tipBox, { backgroundColor: colors.cardBackground }]}> {/* Apply background color */}
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.iconRed} /> {/* Apply icon color */}
            <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text> {/* Apply text color */}
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>Still Need Help?</Text> {/* Apply text color */}
        <TouchableOpacity
          onPress={contactSupport}
          style={[styles.contactButton, { backgroundColor: colors.iconRed, borderColor: colors.borderColor }]} // Apply background and border color
        >
          <Ionicons name="mail-outline" size={20} color={colors.buttonText} /> {/* Apply icon color */}
          <Text style={[styles.contactText, { color: colors.buttonText }]}>Contact Support</Text> {/* Apply text color */}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 30,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 12,
  },
  faqBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2, // Android shadow
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  faqAnswer: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  tipText: {
    fontSize: 14,
  },
  contactButton: {
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  contactText: {
    fontWeight: '700',
    fontSize: 16,
  },
});