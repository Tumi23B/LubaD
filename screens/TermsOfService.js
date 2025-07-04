import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function TermsOfService() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.subtitle}>Effective Date: July 2025</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using Luba Delivery, you agree to be bound by these terms. If you do not agree, do not use our services.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Services</Text>
        <Text style={styles.paragraph}>
          Luba Delivery connects users with drivers to move personal items. We reserve the right to modify, suspend, or discontinue any part of the service at any time.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          You must provide accurate information, follow all laws, and not use the service for illegal or prohibited activities.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Payments</Text>
        <Text style={styles.paragraph}>
          All payments are handled securely. You agree to pay all applicable fees shown during the booking process.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Cancellations & Refunds</Text>
        <Text style={styles.paragraph}>
          You may cancel a ride prior to dispatch. Refunds may be limited depending on the cancellation time and driver effort.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>6. Liability</Text>
        <Text style={styles.paragraph}>
          Luba Delivery is not liable for damages, loss, or delays caused during transit, except where required by law.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>7. Account Suspension</Text>
        <Text style={styles.paragraph}>
          We may suspend or terminate your account for violation of these terms or misuse of the platform.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>8. Updates</Text>
        <Text style={styles.paragraph}>
          We may update these terms at any time. Continued use of the app constitutes your agreement to the revised terms.
        </Text>
      </View>

      <View style={styles.footerBox}>
        <Text style={styles.footerLabel}>Still have questions?</Text>
        <Text style={styles.footerText}>📧 support@lubadelivery.com</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#b80000',
    marginTop: 30,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#b80000',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#b80000',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  footerBox: {
    marginTop: 30,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  footerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#b80000',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#c5a34f',
    fontWeight: '500',
  },
});
