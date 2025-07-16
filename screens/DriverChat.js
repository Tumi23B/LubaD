import React, { useContext, useEffect, useState } from 'react';
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

LogBox.ignoreLogs([
  'Firebase authentication error: Firebase: Error (auth/admin-restricted-operation).',
]);

{/*Or ignore all logs (not recommended unless you're demoing)
LogBox.ignoreAllLogs(true);*/}

const defaultAvatar = require('../assets/icon.png');

export default function DriverChatScreen({ route }) {
  const { colors } = useContext(ThemeContext);
  const customerName = route.params?.customerName || 'Customer';
  const customerPhone = route.params?.customerPhone || '';
  const customerImage = route.params?.customerImage;
  const customerId = route.params?.customerId;

  const [customerImageUrl, setCustomerImageUrl] = useState(customerImage || null);

  useEffect(() => {
    const fetchImage = async () => {
      if (!customerImageUrl && customerId) {
        const userRef = ref(database, 'users/' + customerId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.imageUrl) {
            setCustomerImageUrl(data.imageUrl);
          }
        }
      }
    };
    fetchImage();
  }, [customerId]);

  const openWhatsApp = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Missing Number', 'Customer phone number is not available.');
      return;
    }

    const cleaned = phoneNumber.startsWith('+') ? phoneNumber : `+27${phoneNumber.replace(/^0/, '')}`;
    const url = `https://wa.me/${cleaned}`;

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

  const callCustomer = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Missing Number', 'Customer phone number is not available.');
      return;
    }

    const telURL = `tel:${phoneNumber.startsWith('+') ? phoneNumber : `+27${phoneNumber.replace(/^0/, '')}`}`;
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
            customerImageUrl
              ? { uri: imageUrl}
              : defaultAvatar
          }
          style={[styles.avatar, { borderColor: colors.iconRed }]}
        />
        <Text style={[styles.name, { color: colors.iconRed }]}>
          {customerName}
        </Text>
        <Text style={[styles.phone, { color: colors.textSecondary }]}>
          {customerPhone || 'N/A'}
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => openWhatsApp(customerPhone)}
            style={[styles.button, { backgroundColor: '#25D366' }]}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.buttonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => callCustomer(customerPhone)}
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
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  phone: {
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
