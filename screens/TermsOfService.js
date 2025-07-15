import React, { useContext } from 'react'; // Import useContext
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ThemeContext } from '../ThemeContext'; // Ensure this path is correct

export default function TermsOfService() {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme and colors

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]} // Apply background color
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.title, { color: colors.iconRed }]}>Terms of Service</Text> {/* Apply text color */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Effective Date: July 2025</Text> {/* Apply text color */}

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}> {/* Apply background and border color */}
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>1. Acceptance of Terms</Text> {/* Apply text color */}
        <Text style={[styles.paragraph, { color: colors.text }]}> {/* Apply text color */}
          By accessing or using Luba Delivery, you agree to be bound by these terms. If you do not agree, do not use our services.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>2. Services</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Luba Delivery connects users with drivers to move personal items. We reserve the right to modify, suspend, or discontinue any part of the service at any time.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>3. User Responsibilities</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You must provide accurate information, follow all laws, and not use the service for illegal or prohibited activities.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>4. Payments</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          All payments are handled securely. You agree to pay all applicable fees shown during the booking process.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>5. Cancellations & Refunds</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You may cancel a ride prior to dispatch. Refunds may be limited depending on the cancellation time and driver effort.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>6. Liability</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Luba Delivery is not liable for damages, loss, or delays caused during transit, except where required by law.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>7. Account Suspension</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may suspend or terminate your account for violation of these terms or misuse of the platform.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftColor: colors.iconRed }]}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>8. Updates</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may update these terms at any time. Continued use of the app constitutes your agreement to the revised terms.
        </Text>
      </View>

      <View style={[styles.footerBox, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}> {/* Apply background and border color */}
        <Text style={[styles.footerLabel, { color: colors.iconRed }]}>Still have questions?</Text> {/* Apply text color */}
        <Text style={[styles.footerText, { color: colors.borderColor }]}>📧 lubadapp@gmail.com</Text> {/* Using borderColor for the golden hue */}
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