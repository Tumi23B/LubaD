import React, { useContext } from 'react'; 
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../ThemeContext'; 

export default function TermsOfService() {
  const { colors } = useContext(ThemeContext); // Only colors needed

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.title, { color: colors.iconRed }]}>Terms of Service</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Effective Date: July 2025</Text>

      {[ 
        {
          title: '1. Acceptance of Terms',
          content: 'By accessing or using Luba Delivery, you agree to be bound by these terms. If you do not agree, do not use our services.'
        },
        {
          title: '2. Services',
          content: 'Luba Delivery connects users with drivers to move personal items. We reserve the right to modify, suspend, or discontinue any part of the service at any time.'
        },
        {
          title: '3. User Responsibilities',
          content: 'You must provide accurate information, follow all laws, and not use the service for illegal or prohibited activities.'
        },
        {
          title: '4. Payments',
          content: 'All payments are handled securely. You agree to pay all applicable fees shown during the booking process.'
        },
        {
          title: '5. Cancellations & Refunds',
          content: 'You may cancel a ride prior to dispatch. Refunds may be limited depending on the cancellation time and driver effort.'
        },
        {
          title: '6. Liability',
          content: 'Luba Delivery is not liable for damages, loss, or delays caused during transit, except where required by law.'
        },
        {
          title: '7. Account Suspension',
          content: 'We may suspend or terminate your account for violation of these terms or misuse of the platform.'
        },
        {
          title: '8. Updates',
          content: 'We may update these terms at any time. Continued use of the app constitutes your agreement to the revised terms.'
        }
      ].map(({ title, content }, i) => (
        <View key={i} style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}>
          <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>{title}</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>{content}</Text>
        </View>
      ))}

      <View style={[styles.footerBox, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
        <Text style={[styles.footerLabel, { color: colors.iconRed }]}>Still have questions?</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:lubadapp@gmail.com')}>
          <Text style={[styles.footerText, { color: colors.borderColor, textDecorationLine: 'underline' }]}>
            📧 lubadapp@gmail.com
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
  footerBox: {
    marginTop: 30,
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  footerLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
