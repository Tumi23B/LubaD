import React, { useState, useEffect, useContext, useRef } from 'react'; 
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
//import { Audio } from 'expo-av'; 
import * as Haptics from 'expo-haptics';
//import * as Notifications from 'expo-notifications';
import { ThemeContext } from '../ThemeContext';
import { LogBox } from 'react-native';

// Ignore specific warning messages
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

{/*Or ignore all logs (not recommended unless you're demoing)
LogBox.ignoreAllLogs(true);*/}

LogBox.ignoreLogs([' Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at https://docs.expo.dev/develop/development-builds/introduction/.',]);

// List of available notification tones
const availableTones = [
  { id: 'tone1', name: 'Classic Beep' },
  { id: 'tone2', name: 'Soft Chime' },
  { id: 'tone3', name: 'Digital Alert' },
  { id: 'tone4', name: 'Soft Buzz' },
  { id: 'tone5', name: 'Ping' },
];

// Map tone ids to local audio files
const toneFiles = {
  tone1: require('../assets/classic-beep.mp3'),
  tone2: require('../assets/soft-chime.mp3'),
  tone3: require('../assets/digital-alert.mp3'),
  tone4: require('../assets/soft-buzz.mp3'),
  tone5: require('../assets/ping.mp3'),
};

export default function NotificationSettings() {
  const { isDarkMode, colors } = useContext(ThemeContext); // Get theme info and colors from context

  // State for notification preferences toggles
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [driverMessages, setDriverMessages] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [appAlerts, setAppAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Selected tones for driver messages and app alerts
  const [driverTone, setDriverTone] = useState(availableTones[0]);
  const [appAlertTone, setAppAlertTone] = useState(availableTones[1]);

  // Modal visibility and which tone picker is open ('driver' or 'app')
  const [tonePickerVisible, setTonePickerVisible] = useState(false);
  const [selectedToneFor, setSelectedToneFor] = useState(null);

  // State and animated value for test notification feedback message
  const [testFeedback, setTestFeedback] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Function to open the tone picker modal for driver or app alerts
  const openTonePicker = (forWhich) => {
    setSelectedToneFor(forWhich);
    setTonePickerVisible(true);
  };

  // Function to select a tone from the picker and update the corresponding state
  const selectTone = (tone) => {
    if (selectedToneFor === 'driver') {
      setDriverTone(tone);
    } else if (selectedToneFor === 'app') {
      setAppAlertTone(tone);
    }
    setTonePickerVisible(false);
  };

  // Configure audio mode when component mounts (for Expo Audio playback)
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true, // allows sound in silent mode on iOS
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // Preload sound files to cache them for quick playback
  useEffect(() => {
    Object.values(toneFiles).forEach(async (file) => {
      const sound = new Audio.Sound();
      await sound.loadAsync(file);
      await sound.unloadAsync(); // Unload after caching
    });
  }, []);

  // Function to play a notification tone based on its id
  async function playNotificationTone(toneId) {
    const soundObject = new Audio.Sound();
    try {
      if (soundObject._loaded) await soundObject.stopAsync();

      await soundObject.loadAsync(toneFiles[toneId]);
      await soundObject.playAsync();

      // Unload sound after playback finishes to free resources
      soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          soundObject.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  // Function to trigger vibration/haptic feedback
  function vibrateNotification() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Listen for incoming notifications and trigger sound/vibration if enabled
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      if (soundEnabled) playNotificationTone(appAlertTone.id);
      if (vibrationEnabled) vibrateNotification();
    });

    return () => {
      subscription.remove();
    };
  }, [soundEnabled, vibrationEnabled, appAlertTone]);

  // Handle pressing the "Test Notification" button
  // Plays tones & vibration as per settings and shows feedback text with fade animation
  const handleTestNotification = () => {
    if (soundEnabled) {
      if (appAlerts) playNotificationTone(appAlertTone.id);
      if (driverMessages) playNotificationTone(driverTone.id);
    }
    if (vibrationEnabled) vibrateNotification();

    setTestFeedback('Test notification sent!');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setTestFeedback(''));
      }, 2000);
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Screen title */}
      <Text style={[styles.title, { color: colors.iconRed }]}>Notification Settings</Text>

      {/* Order Updates toggle */}
      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: colors.text }]}>Order Updates</Text>
        <Switch
          trackColor={{ false: colors.switchInactive, true: colors.iconRed }}
          thumbColor={orderUpdates ? colors.borderColor : colors.switchThumb}
          ios_backgroundColor={colors.switchInactive}
          onValueChange={setOrderUpdates}
          value={orderUpdates}
        />
      </View>

      {/* Messages from Drivers toggle */}
      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: colors.text }]}>Messages from Drivers</Text>
        <Switch
          trackColor={{ false: colors.switchInactive, true: colors.iconRed }}
          thumbColor={driverMessages ? colors.borderColor : colors.switchThumb}
          ios_backgroundColor={colors.switchInactive}
          onValueChange={setDriverMessages}
          value={driverMessages}
        />
      </View>

      {/* Driver Message Tone selector, visible only if driver messages enabled */}
      {driverMessages && (
        <TouchableOpacity
          style={[styles.toneSelector, { backgroundColor: colors.cardBackground, shadowColor: colors.shadowColor }]}
          onPress={() => openTonePicker('driver')}
        >
          <Text style={[styles.label, { color: colors.text }]}>Driver Message Tone</Text>
          <Text style={[styles.toneName, { color: colors.iconRed }]}>{driverTone.name}</Text>
        </TouchableOpacity>
      )}

      {/* Promotional Offers toggle */}
      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: colors.text }]}>Promotional Offers</Text>
        <Switch
          trackColor={{ false: colors.switchInactive, true: colors.iconRed }}
          thumbColor={promotions ? colors.borderColor : colors.switchThumb}
          ios_backgroundColor={colors.switchInactive}
          onValueChange={setPromotions}
          value={promotions}
        />
      </View>

      {/* App Alerts toggle */}
      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: colors.text }]}>App Alerts</Text>
        <Switch
          trackColor={{ false: colors.switchInactive, true: colors.iconRed }}
          thumbColor={appAlerts ? colors.borderColor : colors.switchThumb}
          ios_backgroundColor={colors.switchInactive}
          onValueChange={setAppAlerts}
          value={appAlerts}
        />
      </View>

      {/* App Alert Tone selector, visible only if app alerts enabled */}
      {appAlerts && (
        <TouchableOpacity
          style={[styles.toneSelector, { backgroundColor: colors.cardBackground, shadowColor: colors.shadowColor }]}
          onPress={() => openTonePicker('app')}
        >
          <Text style={[styles.label, { color: colors.text }]}>App Alert Tone</Text>
          <Text style={[styles.toneName, { color: colors.iconRed }]}>{appAlertTone.name}</Text>
        </TouchableOpacity>
      )}

      {/* Divider line */}
      <View style={[styles.divider, { backgroundColor: colors.iconRed }]} />

      {/* Sound & Vibration subtitle */}
      <Text style={[styles.subTitle, { color: colors.iconRed }]}>Sound & Vibration</Text>

      {/* Sound toggle */}
      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: colors.text }]}>Sound</Text>
        <Switch
          trackColor={{ false: colors.switchInactive, true: colors.iconRed }}
          thumbColor={soundEnabled ? colors.borderColor : colors.switchThumb}
          ios_backgroundColor={colors.switchInactive}
          onValueChange={setSoundEnabled}
          value={soundEnabled}
        />
      </View>

      {/* Vibration toggle */}
      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: colors.text }]}>Vibration</Text>
        <Switch
          trackColor={{ false: colors.switchInactive, true: colors.iconRed }}
          thumbColor={vibrationEnabled ? colors.borderColor : colors.switchThumb}
          ios_backgroundColor={colors.switchInactive}
          onValueChange={setVibrationEnabled}
          value={vibrationEnabled}
        />
      </View>

      {/* Modal for selecting notification tones */}
      <Modal
        visible={tonePickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTonePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.iconRed }]}>Select Notification Tone</Text>
            <FlatList
              data={availableTones}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.toneOption}
                  onPress={() => selectTone(item)}
                >
                  <Text
                    style={[
                      styles.toneOptionText,
                      { color: colors.text },
                      (selectedToneFor === 'driver' && item.id === driverTone.id) ||
                      (selectedToneFor === 'app' && item.id === appAlertTone.id)
                        ? { color: colors.iconRed, fontWeight: 'bold' }
                        : null,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.borderColorFaint }]} />}
            />
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.iconRed }]}
              onPress={() => setTonePickerVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.buttonText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Button to test notifications */}
      <TouchableOpacity
        style={[styles.toneSelector, { backgroundColor: colors.borderColor }]}
        onPress={handleTestNotification}
      >
        <Text style={{ color: colors.background, fontWeight: 'bold' }}>Test Notification</Text>
      </TouchableOpacity>

      {/* Animated feedback text shown on test notification press */}
      {testFeedback ? (
        <Animated.View style={[styles.testFeedbackContainer, { opacity: fadeAnim }]}>
          <Text style={[styles.testFeedbackText, { color: colors.text }]}>{testFeedback}</Text>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    marginTop: 30,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  toneSelector: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,               // Android shadow
    shadowOffset: { width: 0, height: 1 },  // iOS shadow
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toneName: {
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    marginVertical: 25,
    opacity: 0.3,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  toneOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  toneOptionText: {
    fontSize: 18,
  },
  separator: {
    height: 1,
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  modalCloseText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  testFeedbackContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  testFeedbackText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
