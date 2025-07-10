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
const customerAvatar = require('../assets/icon.jpeg');

export default function DriverChatScreen({ route }) {
  const { isDarkMode, colors } = useContext(ThemeContext);
  const customerName = route.params?.customerName || 'Customer';
  const customerPhone = route.params?.customerPhone || 'No number';

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
          <Image source={customerAvatar} style={[styles.avatar, { borderColor: colors.iconRed }]} />
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
