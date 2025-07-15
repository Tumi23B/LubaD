import React, { useContext } from 'react'; // Import useContext
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext'; // Import ThemeContext

export default function PrivacyPolicy() {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme and colors

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]} // Apply background color
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.title, { color: colors.iconRed }]}>Privacy Policy</Text> {/* Apply text color */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Last updated: July 2025</Text> {/* Apply text color */}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>1. Introduction</Text> {/* Apply text color */}
        <Text style={[styles.paragraph, { color: colors.text }]}> {/* Apply text color */}
          At Luba Delivery, we take your privacy seriously. This policy explains how we collect,
          use, and protect your personal information when you use our services.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>2. Information We Collect</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We collect your name, email, phone number, pickup and drop-off locations, and payment
          information. We may also collect location data to improve delivery accuracy.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>3. How We Use Your Information</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Your data is used to complete deliveries, provide customer support, improve our services,
          and ensure platform safety. We do not sell your personal data to third parties.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>4. Data Sharing</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Your information may be shared with drivers, payment processors, or service providers
          involved in delivery operations. We ensure these third parties uphold strict privacy standards.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>5. Security</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use encryption and secure storage to protect your data. While we strive for full security,
          no method of transmission is 100% secure.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>6. Your Rights</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You may access, update, or delete your information at any time through your profile settings
          or by contacting support@lubadelivery.com.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>7. Changes to This Policy</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may update this policy occasionally. Changes will be posted here with an updated date.
          Please check back regularly.
        </Text>
      </View>

      <View style={[styles.contact, { borderTopColor: colors.borderColor }]}> {/* Apply border color */}
        <Ionicons name="mail-outline" size={18} color={colors.iconRed} /> {/* Apply icon color */}
        <Text style={[styles.footer, { color: colors.borderColor }]}> {/* Apply text color */}
          Contact us at <Text style={[styles.email, { color: colors.iconRed }]}>lubadapp@gmail.com</Text> for any privacy-related questions. {/* Apply text color */}
        </Text>
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
    paddingBottom: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
  contact: {
    marginTop: 30,
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  footer: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  email: {
    fontWeight: '600',
  },
});