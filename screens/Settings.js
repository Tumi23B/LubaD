import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';

export default function Settings({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <ScrollView style={[styles.container, isDarkMode ? styles.darkMode : styles.lightMode]}>
      <View style={styles.section}>
        <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
          Settings ⚙️
        </Text>
        <Text style={[styles.subtitle, isDarkMode ? styles.darkText : styles.lightText]}>
          Manage your account and preferences.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, isDarkMode ? styles.darkText : styles.lightText]}>Account</Text>
        <TouchableOpacity style={[styles.settingLink, isDarkMode ? styles.darkCard : styles.lightCard]} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={20} color={isDarkMode ? "#fff" : "#b80000"} />
          <Text style={[styles.settingText, isDarkMode ? styles.darkText : styles.lightText]}>Profile Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingLink, isDarkMode ? styles.darkCard : styles.lightCard]} onPress={() => navigation.navigate('DriverApplication')}>
          <Ionicons name="car-outline" size={20} color={isDarkMode ? "#fff" : "#b80000"} />
          <Text style={[styles.settingText, isDarkMode ? styles.darkText : styles.lightText]}>Become a Driver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, isDarkMode ? styles.darkText : styles.lightText]}>Preferences</Text>
        <TouchableOpacity style={[styles.settingLink, isDarkMode ? styles.darkCard : styles.lightCard]} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={20} color={isDarkMode ? "#fff" : "#b80000"} />
          <Text style={[styles.settingText, isDarkMode ? styles.darkText : styles.lightText]}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingLink, isDarkMode ? styles.darkCard : styles.lightCard]} onPress={() => navigation.navigate('AppThemeScreen')}>
          <Ionicons name="color-palette-outline" size={20} color={isDarkMode ? "#fff" : "#b80000"} />
          <Text style={[styles.settingText, isDarkMode ? styles.darkText : styles.lightText]}>App Theme</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, isDarkMode ? styles.darkText : styles.lightText]}>Support</Text>
        <TouchableOpacity style={[styles.settingLink, isDarkMode ? styles.darkCard : styles.lightCard]} onPress={() => navigation.navigate('HelpCenter')}>
          <Ionicons name="help-circle-outline" size={20} color={isDarkMode ? "#fff" : "#b80000"} />
          <Text style={[styles.settingText, isDarkMode ? styles.darkText : styles.lightText]}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingLink, isDarkMode ? styles.darkCard : styles.lightCard]} onPress={() => navigation.navigate('Feedback')}>
          <Ionicons name="chatbubbles-outline" size={20} color={isDarkMode ? "#fff" : "#b80000"} />
          <Text style={[styles.settingText, isDarkMode ? styles.darkText : styles.lightText]}>Send Feedback</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, isDarkMode ? styles.darkText : styles.lightText]}>Legal</Text>
        <TouchableOpacity style={[styles.settingLink, isDarkMode ? styles.darkCard : styles.lightCard]} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Ionicons name="document-text-outline" size={20} color={isDarkMode ? "#fff" : "#b80000"} />
          <Text style={[styles.settingText, isDarkMode ? styles.darkText : styles.lightText]}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingLink, isDarkMode ? styles.darkCard : styles.lightCard]} onPress={() => navigation.navigate('Terms')}>
          <Ionicons name="shield-checkmark-outline" size={20} color={isDarkMode ? "#fff" : "#b80000"} />
          <Text style={[styles.settingText, isDarkMode ? styles.darkText : styles.lightText]}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
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
    gap: 10,
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
    color: '#fff',
  },
  lightCard: {
    backgroundColor: '#fff',
  },
  darkCard: {
    backgroundColor: '#333',
  },
});
