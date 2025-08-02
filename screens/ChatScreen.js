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
import { LogBox } from 'react-native';

// Ignore specific warning messages
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

//default driver avatar image (fallback when no profile image is available)
const driverAvatar = require('../assets/icon.png');

export default function ChatScreen({ route }) {
  // Access theme context for colors
  const { colors } = useContext(ThemeContext);
  const { driverId } = route.params;
  const [driverProfile, setDriverProfile] = useState(null);

    // Fetch driver profile when component mounts or driverId changes
  useEffect(() => {
    if (!driverId || !database) return;
 // Reference to the driver's data in Firebase
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

  //Open WhatsApp with the driver's phone number
  const openWhatsApp = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Missing Number', 'Driver phone number is not available.');
      return;
    }

    // Clean the phone number (remove non-numeric characters)
    const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanedNumber}`;

    // Check if WhatsApp can be opened, then open it
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
//Initiates a phone call to the driver
  const callDriver = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Missing Number', 'Driver phone number is not available.');
      return;
    }

    const telURL = `tel:${phoneNumber}`;
     // Check if phone app can be opened, then initiate call
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
      {/* Main content container */}
      <View style={styles.centerContent}>
        {/* Driver profile image with fallback to default avatar */}
        <Image
          source={
            driverProfile?.profileImage
              ? { uri: driverProfile.profileImage }
              : driverAvatar
          }
          style={[styles.driverImage, { borderColor: colors.iconRed }]}
        />
        {/* Driver name */}
        <Text style={[styles.driverName, { color: colors.iconRed }]}>
          {driverProfile?.fullName || 'Driver'}
        </Text>
        {/* Driver phone number */}
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
