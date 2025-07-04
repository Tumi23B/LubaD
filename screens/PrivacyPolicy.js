import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.subtitle}>Last updated: July 2025</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          At Luba Delivery, we take your privacy seriously. This policy explains how we collect,
          use, and protect your personal information when you use our services.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect your name, email, phone number, pickup and drop-off locations, and payment
          information. We may also collect location data to improve delivery accuracy.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          Your data is used to complete deliveries, provide customer support, improve our services,
          and ensure platform safety. We do not sell your personal data to third parties.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Data Sharing</Text>
        <Text style={styles.paragraph}>
          Your information may be shared with drivers, payment processors, or service providers
          involved in delivery operations. We ensure these third parties uphold strict privacy standards.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Security</Text>
        <Text style={styles.paragraph}>
          We use encryption and secure storage to protect your data. While we strive for full security,
          no method of transmission is 100% secure.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.paragraph}>
          You may access, update, or delete your information at any time through your profile settings
          or by contacting support@lubadelivery.com.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this policy occasionally. Changes will be posted here with an updated date.
          Please check back regularly.
        </Text>
      </View>

      <View style={styles.contact}>
        <Ionicons name="mail-outline" size={18} color="#b80000" />
        <Text style={styles.footer}>
          Contact us at <Text style={styles.email}>support@lubadelivery.com</Text> for any privacy-related questions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#b80000',
    marginTop: 30,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b80000',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  contact: {
    marginTop: 30,
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footer: {
    fontSize: 14,
    color: '#c5a34f',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  email: {
    color: '#b80000',
    fontWeight: '600',
  },
});
