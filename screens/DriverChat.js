import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../ThemeContext';
import { ref, get } from 'firebase/database';
import { database } from '../firebase';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
  'Firebase authentication error: Firebase: Error (auth/admin-restricted-operation).',
]);

const defaultAvatar = require('../assets/icon.png');

export default function DriverChatScreen({ route }) {
  const { colors } = useContext(ThemeContext);
  const customerName = route.params?.customerName || 'Customer';
  const customerPhone = route.params?.customerPhone || '';
  const customerImage = route.params?.customerImage;
  const customerId = route.params?.customerId;

  const [customerImageUrl, setCustomerImageUrl] = useState(customerImage || null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const formatPhone = (phoneNumber) => {
    return phoneNumber.startsWith('+')
      ? phoneNumber
      : `+27${phoneNumber.replace(/^0/, '')}`;
  };

  const openWhatsApp = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Missing Number', 'Customer phone number is not available.');
      return;
    }

    const url = `https://wa.me/${formatPhone(phoneNumber)}`;
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

    const telURL = `tel:${formatPhone(phoneNumber)}`;
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

  // This just opens the modal
  const showLiveLocationModal = () => {
    if (!customerPhone) {
      Alert.alert('Missing Number', 'Customer phone number is not available.');
      return;
    }
    setModalVisible(true);
  };

  // When user confirms in modal, open WhatsApp with message
  const confirmSendLiveLocation = () => {
    const message = ``;
    const waURL = `https://wa.me/${formatPhone(customerPhone)}?text=${encodeURIComponent(message)}`;
    setModalVisible(false);
    Linking.openURL(waURL).catch((err) =>
      console.error('Failed to open WhatsApp with live location instructions:', err)
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <Image
          source={
            customerImageUrl
              ? { uri: customerImageUrl }
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

        <TouchableOpacity
          onPress={showLiveLocationModal}
          style={[styles.button, { backgroundColor: '#34B7F1', marginTop: 10 }]}
        >
          <Ionicons name="location-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Share Live Location on WhatsApp</Text>
        </TouchableOpacity>

        <Text style={[styles.infoText, { color: colors.text }]}>
          For real-time location updates, please share your live location inside WhatsApp using the attachment icon.
        </Text>

        {/* Modal for live location instructions */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalView, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.iconRed }]}>
                How to Share Live Location
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>
                1. Tap the 📎 (attachment) icon in WhatsApp.{'\n'}
                2. Select "Share live location".{'\n'}
                3. Choose the duration to share your location.{'\n'}
                4. The customer will be able to track you live in real-time!
              </Text>

              <View style={styles.modalButtonsRow}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmSendLiveLocation}
                >
                  <Text style={styles.confirmButtonText}>Got it! Open WhatsApp</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    marginTop: 20,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 15,
    padding: 25,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 17,
    lineHeight: 24,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#aaa',
  },
  confirmButton: {
    backgroundColor: '#25D366',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
