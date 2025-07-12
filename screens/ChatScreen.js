import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../ThemeContext';

const driverAvatar = require('../assets/icon.jpeg');

export default function ChatScreen({ route }) {
  const { isDarkMode, colors } = React.useContext(ThemeContext);
  const { driverName, driverPhone } = route.params;

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
        <View style={[styles.driverHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
          <Image source={driverAvatar} style={[styles.driverImage, { borderColor: colors.iconRed }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.driverName, { color: colors.iconRed }]} numberOfLines={1}>
              {driverName}
            </Text>
            <Text style={[styles.driverPhone, { color: colors.textSecondary }]} numberOfLines={1}>
              {driverPhone}
            </Text>
          </View>
          <TouchableOpacity onPress={() => openWhatsApp(driverPhone)} style={styles.whatsappButton}>
            <Ionicons name="logo-whatsapp" size={30} color={colors.iconRed} />
          </TouchableOpacity>
        </View>
        <View style={styles.infoTextWrapper}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            For direct communication and live location sharing, please use WhatsApp.
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
  container: { flex: 1 },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  driverImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700',
  },
  driverPhone: {
    fontSize: 13,
  },
  whatsappButton: {
    marginRight: 12,
  },
  infoTextWrapper: {
    padding: 20,
  },
  infoText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
