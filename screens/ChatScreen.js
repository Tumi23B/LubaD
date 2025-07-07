import React, { useState, useContext } from 'react';
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
import { ThemeContext } from '../ThemeContext';

const userAvatar = require('../assets/icon.jpeg');
const driverAvatar = require('../assets/icon.jpeg');

export default function ChatScreen({ route }) {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme

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
    } else {
      Alert.alert('No phone number', 'Driver phone number is not available.');
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
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.driverBubble,
              { backgroundColor: isUser ? colors.iconRed : colors.cardBackground } // Apply theme colors
            ]}
            onPress={() => Linking.openURL(item.mapsUrl)}
          >
            <Text style={[styles.messageText, isUser ? { color: colors.buttonText } : { color: colors.text }]}>
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
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.driverBubble,
            { backgroundColor: isUser ? colors.iconRed : colors.cardBackground } // Apply theme colors
          ]}
        >
          <Text style={[styles.messageText, isUser ? { color: colors.buttonText } : { color: colors.text }]}>
            {item.text}
          </Text>
        </View>
        {isUser && <Image source={userAvatar} style={styles.avatar} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={[styles.driverHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
          <Image source={driverAvatar} style={[styles.driverImage, { borderColor: colors.iconRed }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.driverName, { color: colors.iconRed }]} numberOfLines={1} ellipsizeMode="tail">
              {driverName}
            </Text>
            <Text style={[styles.driverPhone, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {driverPhone}
            </Text>
          </View>
          <TouchableOpacity onPress={callDriver} style={{ marginRight: 12 }}>
            <Ionicons name="call" size={28} color={colors.iconRed} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
        />

        <View style={[styles.inputRow, { borderTopColor: colors.borderColor, backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity onPress={shareLocation} style={styles.locationButton}>
            <Ionicons name="location-sharp" size={28} color={colors.iconRed} />
          </TouchableOpacity>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
          />
          <TouchableOpacity onPress={sendMessage} style={[styles.sendButton, { backgroundColor: colors.iconRed }]}>
            <Text style={[styles.sendText, { color: colors.buttonText }]}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor handled by theme
  },
  container: { flex: 1 },

  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor handled by theme
    padding: 16,
    borderBottomWidth: 1,
    // borderColor handled by theme
  },
  driverImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    // borderColor handled by theme
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700',
    // color handled by theme
  },
  driverPhone: {
    fontSize: 13,
    // color handled by theme
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
    borderTopRightRadius: 0,
  },
  driverBubble: {
    borderTopLeftRadius: 0,
  },
  messageText: {
    // color handled by theme
  },

  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    // borderColor, backgroundColor handled by theme
  },

  locationButton: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 1,
    // backgroundColor, color, borderColor handled by theme
  },

  sendButton: {
    marginLeft: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    // backgroundColor handled by theme
  },

  sendText: {
    fontWeight: '600',
    // color handled by theme
  },
});
