import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Settings({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Settings ⚙️</Text>
        <Text style={styles.subtitle}>Manage your account and preferences.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Account</Text>
        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Profile Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('ChangePassword')}>
          <Ionicons name="key-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Change Password</Text>
        </TouchableOpacity>

        {/* Become a Driver button as another settingLink */}
        <TouchableOpacity
          style={styles.settingLink}
          onPress={() => navigation.navigate('DriverApplication')}
        >
          <Ionicons name="car-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Become a Driver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Preferences</Text>
        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('Theme')}>
          <Ionicons name="color-palette-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>App Theme</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Support</Text>
        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('Help')}>
          <Ionicons name="help-circle-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('Feedback')}>
          <Ionicons name="chatbubbles-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Send Feedback</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Legal</Text>
        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('Privacy')}>
          <Ionicons name="document-text-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('Terms')}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
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
    color: '#b80000',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    color: '#333',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#b80000',
  },
  settingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  settingText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});
 