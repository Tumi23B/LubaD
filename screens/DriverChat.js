import React, { useContext } from 'react';
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
import { useEffect, useState } from 'react';
import { database } from '../firebase'; // adjust based on your setup



export default function DriverChatScreen({ route }) {
  const { isDarkMode, colors } = useContext(ThemeContext);
  const customerName = route.params?.customerName || 'Customer';
  const customerPhone = route.params?.customerPhone || 'No number';
  console.log("Chat screen params:", route.params);
  const customerImage = route.params?.customerImage;
  console.log('Customer image URL:', customerImage);
  const customerId = route.params?.customerId;
  const [loadingImage, setLoadingImage] = useState(true);


  {/* Fetch image URL from database */}
  const [customerImageUrl, setCustomerImageUrl] = useState(customerImage || null);
  console.log('Final image URL used:', customerImageUrl);

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
    const url = `https://wa.me/${phoneNumber}`;
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
          {customerImageUrl ? (
            <Image
              source={{ uri: customerImageUrl }}
              style={[styles.avatar, { borderColor: colors.iconRed }]}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name="person-circle"
              size={50}
              color={colors.iconRed}
              style={[styles.avatar, { borderWidth: 0 }]}
            />
          )}

          <View style={{ flex: 1 }}>
            <Text style={[styles.customerName, { color: colors.iconRed }]} numberOfLines={1}>
              {customerName}
            </Text>
            <Text style={[styles.customerPhone, { color: colors.textSecondary }]} numberOfLines={1}>
              {customerPhone}
            </Text>
          </View>
          <TouchableOpacity onPress={() => openWhatsApp(customerPhone)} style={{ marginRight: 12 }}>
            <Ionicons name="logo-whatsapp" size={30} color={colors.iconRed} />
          </TouchableOpacity>
        </View>
        <View style={styles.infoTextWrapper}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            Tap the WhatsApp icon to message your customer or share your live location through WhatsApp.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
  },
  customerPhone: {
    fontSize: 13,
  },
  infoTextWrapper: {
    padding: 20,
  },
  infoText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
