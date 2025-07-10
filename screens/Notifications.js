import React, { useState, useEffect, useContext } from 'react'; // Import useContext
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { Audio } from 'expo-av'; 
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { ThemeContext } from '../ThemeContext'; // Import ThemeContext

const availableTones = [
  { id: 'tone1', name: 'Classic Beep' },
  { id: 'tone2', name: 'Soft Chime' },
  { id: 'tone3', name: 'Digital Alert' },
  { id: 'tone4', name: 'Soft Buzz' },
  { id: 'tone5', name: 'Ping' },
];

// Importing sound files
const toneFiles = {
  tone1: require('../assets/classic-beep.mp3'),
  tone2: require('../assets/soft-chime.mp3'),
  tone3: require('../assets/digital-alert.mp3'),
  tone4: require('../assets/soft-buzz.mp3'),
  tone5: require('../assets/ping.mp3'),
};

export default function NotificationSettings() {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme and colors

  const [orderUpdates, setOrderUpdates] = useState(true);
  const [driverMessages, setDriverMessages] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [appAlerts, setAppAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const [driverTone, setDriverTone] = useState(availableTones[0]);
  const [appAlertTone, setAppAlertTone] = useState(availableTones[1]);

  const [tonePickerVisible, setTonePickerVisible] = useState(false);
  const [selectedToneFor, setSelectedToneFor] = useState(null); // 'driver' or 'app'

  const openTonePicker = (forWhich) => {
    setSelectedToneFor(forWhich);
    setTonePickerVisible(true);
  };

  const selectTone = (tone) => {
    if (selectedToneFor === 'driver') {
      setDriverTone(tone);
    } else if (selectedToneFor === 'app') {
      setAppAlertTone(tone);
    }
    setTonePickerVisible(false);
  };

  // Set up audio mode for notifications
  useEffect(() => {
  Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    playsInSilentModeIOS: true, // This one is for iOS!
    shouldDuckAndroid: true,
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    playThroughEarpieceAndroid: false,
  });
}, []);

  // Preload tones to cache them
  useEffect(() => {
  Object.values(toneFiles).forEach(async (file) => {
    const sound = new Audio.Sound();
    await sound.loadAsync(file);
    await sound.unloadAsync(); // cache for future use
  });
}, []);

  // Function to play notification tone
  async function playNotificationTone(toneId) {
    const soundObject = new Audio.Sound();
    try {
      // Unload any previously loaded sound to avoid conflicts
      if (soundObject._loaded) await soundObject.stopAsync();

      await soundObject.loadAsync(toneFiles[toneId]);
      await soundObject.playAsync();
      // Optionally unload after playing
      soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          soundObject.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }
  // Function to vibrate notification
  function vibrateNotification() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Play sound and vibrate based on user settings
      if (soundEnabled) playNotificationTone(appAlertTone.id);
      if (vibrationEnabled) vibrateNotification();
    });

    return () => {
      subscription.remove();
    };
  }, [soundEnabled, vibrationEnabled, appAlertTone]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> {/* Apply background color */}
      <Text style={[styles.title, { color: colors.iconRed }]}>Notification Settings</Text> {/* Apply text color */}

      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: colors.text }]}>Order Updates</Text> {/* Apply label text color */}
        <Switch
          trackColor={{ false: colors.switchInactive, true: colors.iconRed }} // Customize track and thumb colors
          thumbColor={orderUpdates ? colors.borderColor : colors.switchThumb}
          ios_backgroundColor={colors.switchInactive}
          onValueChange={setOrderUpdates}
          value={orderUpdates}
        />
      </View>

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

      {driverMessages && (
        <TouchableOpacity
          style={[styles.toneSelector, { backgroundColor: colors.cardBackground, shadowColor: colors.shadowColor }]} // Apply background and shadow
          onPress={() => openTonePicker('driver')}
        >
          <Text style={[styles.label, { color: colors.text }]}>Driver Message Tone</Text>
          <Text style={[styles.toneName, { color: colors.iconRed }]}>{driverTone.name}</Text>
        </TouchableOpacity>
      )}

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

      {appAlerts && (
        <TouchableOpacity
          style={[styles.toneSelector, { backgroundColor: colors.cardBackground, shadowColor: colors.shadowColor }]}
          onPress={() => openTonePicker('app')}
        >
          <Text style={[styles.label, { color: colors.text }]}>App Alert Tone</Text>
          <Text style={[styles.toneName, { color: colors.iconRed }]}>{appAlertTone.name}</Text>
        </TouchableOpacity>
      )}

      <View style={[styles.divider, { backgroundColor: colors.iconRed }]} /> {/* Apply divider color */}

      <Text style={[styles.subTitle, { color: colors.iconRed }]}>Sound & Vibration</Text>

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

      {/* Tone picker modal */}
      <Modal
        visible={tonePickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTonePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}> {/* Apply modal content background */}
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
                      { color: colors.text }, // Default tone option text color
                      (selectedToneFor === 'driver' && item.id === driverTone.id) ||
                      (selectedToneFor === 'app' && item.id === appAlertTone.id)
                        ? { color: colors.iconRed, fontWeight: 'bold' } // Selected tone text color
                        : null,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.borderColorFaint }]} />} /* Apply separator color */
            />
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.iconRed }]} // Apply close button background
              onPress={() => setTonePickerVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.buttonText }]}>Cancel</Text> {/* Apply close button text color */}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[styles.toneSelector, { backgroundColor: colors.borderColor }]} // Apply test notification button background
        onPress={() => {
          // Play both tones if their toggles are enabled
          if (soundEnabled) {
            if (appAlerts) playNotificationTone(appAlertTone.id);
            if (driverMessages) playNotificationTone(driverTone.id);
          }
          if (vibrationEnabled) vibrateNotification();
        }}
      >
        <Text style={{ color: colors.buttonText, fontWeight: 'bold' }}>Test Notification</Text> {/* Apply text color */}
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3, // Android shadow
    shadowOffset: { width: 0, height: 1 }, // iOS shadow
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toneName: {
    fontWeight: '700',
    fontSize: 16,
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
});