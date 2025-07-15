import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';

export default function Settings({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);

  // Determine styles once to avoid repeating ternaries in JSX
  const containerStyle = [styles.container, isDarkMode ? styles.darkMode : styles.lightMode];
  const textStyle = isDarkMode ? styles.darkText : styles.lightText;
  const cardStyle = isDarkMode ? styles.darkCard : styles.lightCard;
  const iconColor = isDarkMode ? '#fff' : '#b80000';

  return (
    <ScrollView style={containerStyle}>
      <View style={styles.section}>
        <Text style={[styles.title, textStyle]}>Settings</Text>
        <Text style={[styles.subtitle, textStyle]}>Manage your account and preferences.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, textStyle]}>Account</Text>
        <TouchableOpacity
          style={[styles.settingLink, cardStyle]}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={20} color={iconColor} />
          <Text style={[styles.settingText, textStyle]}>Profile Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, textStyle]}>Preferences</Text>
        <TouchableOpacity
          style={[styles.settingLink, cardStyle]}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color={iconColor} />
          <Text style={[styles.settingText, textStyle]}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingLink, cardStyle]}
          onPress={() => navigation.navigate('AppThemeScreen')}
          activeOpacity={0.7}
        >
          <Ionicons name="color-palette-outline" size={20} color={iconColor} />
          <Text style={[styles.settingText, textStyle]}>App Theme</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, textStyle]}>Support</Text>
        <TouchableOpacity
          style={[styles.settingLink, cardStyle]}
          onPress={() => navigation.navigate('HelpCenter')}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={20} color={iconColor} />
          <Text style={[styles.settingText, textStyle]}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingLink, cardStyle]}
          onPress={() => navigation.navigate('Feedback')}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={iconColor} />
          <Text style={[styles.settingText, textStyle]}>Send Feedback</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, textStyle]}>Legal</Text>
        <TouchableOpacity
          style={[styles.settingLink, cardStyle]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={20} color={iconColor} />
          <Text style={[styles.settingText, textStyle]}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingLink, cardStyle]}
          onPress={() => navigation.navigate('Terms')}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={iconColor} />
          <Text style={[styles.settingText, textStyle]}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 30,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,          // gap adds spacing between icon and text, better than margin
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Theme styles
  lightMode: {
    backgroundColor: '#f0f0f0',
  },
  darkMode: {
    backgroundColor: '#121212',
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#b80000',
  },
  lightCard: {
    backgroundColor: '#fff',
  },
  darkCard: {
    backgroundColor: '#333',
  },
});
