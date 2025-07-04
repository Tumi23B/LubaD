import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const userAvatar = require('../assets/icon.jpeg');   // Customer avatar placeholder
const driverAvatar = require('../assets/icon.jpeg'); // Driver avatar placeholder

export default function DriverChatScreen({ route }) {
  const customerName = route.params?.customerName || 'Customer';
  const customerPhone = route.params?.customerPhone || 'No number';

  const [messages, setMessages] = useState([
    { id: '1', text: 'Hi there! I need my package delivered today.', sender: 'customer' },
    { id: '2', text: 'Hello! I’m on my way to pick it up now.', sender: 'driver' },
    { id: '3', text: 'Great! Please call me when you arrive.', sender: 'customer' },
    { id: '4', text: 'Will do. Thanks for your patience!', sender: 'driver' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (!inputText.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now().toString(), text: inputText, sender: 'driver' },
    ]);
    setInputText('');
  };

  const callCustomer = () => {
    if (customerPhone !== 'No number') {
      Linking.openURL(`tel:${customerPhone}`);
    } else {
      Alert.alert('No phone number', 'Customer phone number is not available.');
    }
  };

  const shareLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is needed to share your location.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        text: `📍 Shared Location: ${mapsUrl}`,
        sender: 'driver',
        isLocation: true,
        mapsUrl,
      },
    ]);
  };

  const renderMessage = ({ item }) => {
    const isDriver = item.sender === 'driver';

    if (item.isLocation) {
      return (
        <View style={[styles.messageRow, isDriver ? styles.driverRow : styles.customerRow]}>
          {!isDriver && <Image source={userAvatar} style={styles.avatar} />}
          <TouchableOpacity
            style={[styles.messageBubble, isDriver ? styles.driverBubble : styles.customerBubble]}
            onPress={() => Linking.openURL(item.mapsUrl)}
          >
            <Text style={[styles.messageText, isDriver ? styles.driverText : styles.customerText]}>
              {item.text}
            </Text>
          </TouchableOpacity>
          {isDriver && <Image source={driverAvatar} style={styles.avatar} />}
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isDriver ? styles.driverRow : styles.customerRow]}>
        {!isDriver && <Image source={userAvatar} style={styles.avatar} />}
        <View style={[styles.messageBubble, isDriver ? styles.driverBubble : styles.customerBubble]}>
          <Text style={[styles.messageText, isDriver ? styles.driverText : styles.customerText]}>
            {item.text}
          </Text>
        </View>
        {isDriver && <Image source={driverAvatar} style={styles.avatar} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image source={userAvatar} style={styles.customerImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">
              {customerName}
            </Text>
            <Text style={styles.customerPhone} numberOfLines={1} ellipsizeMode="tail">
              {customerPhone}
            </Text>
          </View>
          <TouchableOpacity onPress={callCustomer} style={{ marginRight: 12 }}>
            <Ionicons name="call" size={28} color="#b80000" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
        />

        <View style={styles.inputRow}>
          <TouchableOpacity onPress={shareLocation} style={styles.locationButton}>
            <Ionicons name="location-sharp" size={28} color="#b80000" />
          </TouchableOpacity>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            style={styles.input}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf8f1',
  },
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2e5',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e1cfa0',
  },
  customerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#b80000',
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#b80000',
  },
  customerPhone: {
    fontSize: 13,
    color: '#777',
  },

  chatContainer: {
    padding: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  driverRow: {
    justifyContent: 'flex-end',
  },
  customerRow: {
    justifyContent: 'flex-start',
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  driverBubble: {
    backgroundColor: '#b80000',
    borderTopRightRadius: 0,
  },
  customerBubble: {
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 0,
  },
  driverText: {
    color: '#ffd700', // gold
  },
  customerText: {
    color: '#333',
  },

  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },

  locationButton: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    borderColor: '#e1cfa0',
    borderWidth: 1,
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: '#b80000',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});
