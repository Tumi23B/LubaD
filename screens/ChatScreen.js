import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../ThemeContext';
import { ref, get } from 'firebase/database';
import { database } from '../firebase';

const driverAvatar = require('../assets/icon.jpeg');

export default function ChatScreen({ route }) {
  const { colors } = useContext(ThemeContext);
  const { driverId } = route.params;
  const [driverProfile, setDriverProfile] = useState(null);

  useEffect(() => {
    if (!driverId || !database) return;

    const driverRef = ref(database, `drivers/${driverId}`);
    get(driverRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const profile = snapshot.val();
          setDriverProfile(profile);
        } else {
          console.warn('Driver not found');
        }
      })
      .catch((error) => {
        console.error('Error fetching driver profile:', error);
      });
  }, [driverId]);

  const openWhatsApp = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Missing Number', 'Driver phone number is not available.');
      return;
    }

    const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanedNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Error', 'WhatsApp is not installed or cannot open the link.');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error('Failed to open WhatsApp', err));
  };

  const callDriver = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Missing Number', 'Driver phone number is not available.');
      return;
    }

    const telURL = `tel:${phoneNumber}`;
    Linking.canOpenURL(telURL)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Error', 'Phone app is not available.');
        } else {
          return Linking.openURL(telURL);
        }
      })
      .catch((err) => console.error('Failed to make a call', err));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <Image
          source={
            driverProfile?.profileImage
              ? { uri: driverProfile.profileImage }
              : driverAvatar
          }
          style={[styles.driverImage, { borderColor: colors.iconRed }]}
        />
        <Text style={[styles.driverName, { color: colors.iconRed }]}>
          {driverProfile?.fullName || 'Driver'}
        </Text>
        <Text style={[styles.driverPhone, { color: colors.textSecondary }]}>
          {driverProfile?.phoneNumber || 'N/A'}
        </Text>

        {/* WhatsApp & Call Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => openWhatsApp(driverProfile?.phoneNumber)}
            style={[styles.button, { backgroundColor: '#25D366' }]}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.buttonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => callDriver(driverProfile?.phoneNumber)}
            style={[styles.button, { backgroundColor: '#007AFF' }]}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.infoText, { color: colors.text }]}>
          For direct communication and live location sharing, please use WhatsApp.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  driverImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    marginBottom: 12,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
