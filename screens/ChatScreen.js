import React, { useState, useContext, useEffect } from 'react';
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
import { getDatabase, ref, get, onValue, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const userAvatar = require('../assets/icon.jpeg');
const driverAvatar = require('../assets/icon.jpeg');

export default function ChatScreen({ route }) {
  const { isDarkMode, colors } = useContext(ThemeContext);
  const auth = getAuth();
  const database = getDatabase();

  const { bookingId, driverName, driverPhone, driverId } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [driverOnline, setDriverOnline] = useState(true);
  const [userPhone, setUserPhone] = useState('');

  // Fetch phone numbers and set up chat room
  useEffect(() => {
    const fetchPhones = async () => {
      try {
        const userId = auth.currentUser.uid;
        const userRef = ref(database, `users/${userId}/profile`);
        const driverRef = ref(database, `drivers/${driverId}/profile`);

        const userSnapshot = await get(userRef);
        const driverSnapshot = await get(driverRef);

        const fetchedUserPhone = userSnapshot.val().phoneNumber;
        const fetchedDriverPhone = driverSnapshot.val().phoneNumber;

        setUserPhone(fetchedUserPhone);

        const generatedRoomId = [fetchedUserPhone, fetchedDriverPhone].sort().join('_');
        setRoomId(generatedRoomId);

        const messagesRef = ref(database, `chatRooms/${generatedRoomId}/messages`);
        onValue(messagesRef, (snapshot) => {
          const msgs = snapshot.val() || {};
          const formatted = Object.entries(msgs).map(([id, msg]) => ({ ...msg, id }));
          setMessages(formatted);
        });
      } catch (error) {
        console.error('Error fetching phones or messages:', error);
      }
    };

    fetchPhones();
  }, []);

  // Watch driver's online status
  useEffect(() => {
    const onlineRef = ref(database, `drivers/${driverId}/onlineStatus`);
    onValue(onlineRef, (snapshot) => {
      setDriverOnline(snapshot.val());
    });
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || !roomId || !userPhone) return;

    const newMessageRef = push(ref(database, `chatRooms/${roomId}/messages`));
    await set(newMessageRef, {
      sender: userPhone,
      text: inputText,
      timestamp: Date.now(),
    });

    setInputText('');
  };

  const shareLocation = async () => {
    if (!roomId || !userPhone) return;

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is needed to share your location.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`;

    const newMessageRef = push(ref(database, `chatRooms/${roomId}/messages`));
    await set(newMessageRef, {
      sender: userPhone,
      text: `📍 Shared Location: ${mapsUrl}`,
      isLocation: true,
      mapsUrl,
      timestamp: Date.now(),
    });
  };

  const callDriver = () => {
    if (driverPhone) {
      Linking.openURL(`tel:${driverPhone}`);
    } else {
      Alert.alert('No phone number', 'Driver phone number is not available.');
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === userPhone;

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.driverRow]}>
        {!isUser && <Image source={driverAvatar} style={styles.avatar} />}
        {item.isLocation ? (
          <TouchableOpacity
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.driverBubble,
              { backgroundColor: isUser ? colors.iconRed : colors.cardBackground },
            ]}
            onPress={() => Linking.openURL(item.mapsUrl)}
          >
            <Text style={[styles.messageText, isUser ? { color: colors.buttonText } : { color: colors.text }]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.driverBubble,
              { backgroundColor: isUser ? colors.iconRed : colors.cardBackground },
            ]}
          >
            <Text style={[styles.messageText, isUser ? { color: colors.buttonText } : { color: colors.text }]}>
              {item.text}
            </Text>
          </View>
        )}
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

        {!driverOnline && (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 8 }}>
            Driver is offline. Your messages will be delivered when they're back online.
          </Text>
        )}

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
  safeArea: { flex: 1 },
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
  driverName: { fontSize: 17, fontWeight: '700' },
  driverPhone: { fontSize: 13 },
  chatContainer: { padding: 14 },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  userRow: { justifyContent: 'flex-end' },
  driverRow: { justifyContent: 'flex-start' },
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
