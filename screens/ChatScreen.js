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

const userAvatar = require('../assets/icon.jpeg');
const driverAvatar = require('../assets/icon.jpeg');

export default function ChatScreen({ route }) {
  const { bookingId, driverName, driverPhone } = route.params;

  const [messages, setMessages] = useState([
    { id: '1', text: 'Hi, I’ll be there in 10 mins', sender: 'driver' },
    { id: '2', text: 'Okay, thank you!', sender: 'user' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (!inputText.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now().toString(), text: inputText, sender: 'user' },
    ]);
    setInputText('');
  };

  const callDriver = () => {
    if (driverPhone) {
      Linking.openURL(`tel:${driverPhone}`);
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
        sender: 'user',
        isLocation: true,
        mapsUrl,
      },
    ]);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';

    if (item.isLocation) {
      return (
        <View style={[styles.messageRow, isUser ? styles.userRow : styles.driverRow]}>
          {!isUser && <Image source={driverAvatar} style={styles.avatar} />}
          <TouchableOpacity
            style={[styles.messageBubble, isUser ? styles.userBubble : styles.driverBubble]}
            onPress={() => Linking.openURL(item.mapsUrl)}
          >
            <Text style={[styles.messageText, isUser ? styles.userText : styles.driverText]}>
              {item.text}
            </Text>
          </TouchableOpacity>
          {isUser && <Image source={userAvatar} style={styles.avatar} />}
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.driverRow]}>
        {!isUser && <Image source={driverAvatar} style={styles.avatar} />}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.driverBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.driverText]}>
            {item.text}
          </Text>
        </View>
        {isUser && <Image source={userAvatar} style={styles.avatar} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.driverHeader}>
          <Image source={driverAvatar} style={styles.driverImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName} numberOfLines={1} ellipsizeMode="tail">
              {driverName}
            </Text>
            <Text style={styles.driverPhone} numberOfLines={1} ellipsizeMode="tail">
              {driverPhone}
            </Text>
          </View>
          <TouchableOpacity onPress={callDriver} style={{ marginRight: 12 }}>
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

  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2e5',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e1cfa0',
  },
  driverImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#b80000',
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#b80000',
  },
  driverPhone: {
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
  userRow: {
    justifyContent: 'flex-end',
  },
  driverRow: {
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
  userBubble: {
    backgroundColor: '#b80000',
    borderTopRightRadius: 0,
  },
  driverBubble: {
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 0,
  },
  userText: {
    color: '#ffd700', // gold
  },
  driverText: {
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
