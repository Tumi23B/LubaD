import React, { useState } from 'react';
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

export default function HelpCenter() {
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Help Center</Text>
        <Text style={styles.subtitle}>Find answers, tips, and support below.</Text>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqData.map((item, index) => (
          <View key={index} style={styles.faqBox}>
            <TouchableOpacity onPress={() => toggleFAQ(index)} style={styles.faqHeader}>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#b80000"
              />
              <Text style={styles.faqQuestion}>{item.question}</Text>
            </TouchableOpacity>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Packing Tips</Text>
        {packingTips.map((tip, idx) => (
          <View key={idx} style={styles.tipBox}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#b80000" />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Still Need Help?</Text>
        <TouchableOpacity onPress={contactSupport} style={styles.contactButton}>
          <Ionicons name="mail-outline" size={20} color="#f0c93d" />
          <Text style={styles.contactText}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#b80000',
    marginBottom: 10,
    marginTop: 30,
  },
  subtitle: {
    fontSize: 15,
    color: '#333',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#b80000',
    marginVertical: 12,
  },
  faqBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#b80000',
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
  },
  faqAnswer: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#444',
  },
  contactButton: {
    backgroundColor: '#b80000',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#f0c93d',
  },
  contactText: {
    color: '#f0c93d',
    fontWeight: '700',
    fontSize: 16,
  },
});
