import React, { useState } from 'react';
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

const availableTones = [
  { id: 'tone1', name: 'Classic Beep' },
  { id: 'tone2', name: 'Soft Chime' },
  { id: 'tone3', name: 'Digital Alert' },
  { id: 'tone4', name: 'Buzz' },
  { id: 'tone5', name: 'Ping' },
];

export default function Notifications() {
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Order Updates</Text>
        <Switch
          trackColor={{ false: '#ccc', true: '#b80000' }}
          thumbColor={orderUpdates ? '#c5a34f' : '#f4f3f4'}
          ios_backgroundColor="#ccc"
          onValueChange={setOrderUpdates}
          value={orderUpdates}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Messages from Drivers</Text>
        <Switch
          trackColor={{ false: '#ccc', true: '#b80000' }}
          thumbColor={driverMessages ? '#c5a34f' : '#f4f3f4'}
          ios_backgroundColor="#ccc"
          onValueChange={setDriverMessages}
          value={driverMessages}
        />
      </View>

      {driverMessages && (
        <TouchableOpacity style={styles.toneSelector} onPress={() => openTonePicker('driver')}>
          <Text style={styles.label}>Driver Message Tone</Text>
          <Text style={styles.toneName}>{driverTone.name}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.settingRow}>
        <Text style={styles.label}>Promotional Offers</Text>
        <Switch
          trackColor={{ false: '#ccc', true: '#b80000' }}
          thumbColor={promotions ? '#c5a34f' : '#f4f3f4'}
          ios_backgroundColor="#ccc"
          onValueChange={setPromotions}
          value={promotions}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>App Alerts</Text>
        <Switch
          trackColor={{ false: '#ccc', true: '#b80000' }}
          thumbColor={appAlerts ? '#c5a34f' : '#f4f3f4'}
          ios_backgroundColor="#ccc"
          onValueChange={setAppAlerts}
          value={appAlerts}
        />
      </View>

      {appAlerts && (
        <TouchableOpacity style={styles.toneSelector} onPress={() => openTonePicker('app')}>
          <Text style={styles.label}>App Alert Tone</Text>
          <Text style={styles.toneName}>{appAlertTone.name}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider} />

      <Text style={styles.subTitle}>Sound & Vibration</Text>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Sound</Text>
        <Switch
          trackColor={{ false: '#ccc', true: '#b80000' }}
          thumbColor={soundEnabled ? '#c5a34f' : '#f4f3f4'}
          ios_backgroundColor="#ccc"
          onValueChange={setSoundEnabled}
          value={soundEnabled}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Vibration</Text>
        <Switch
          trackColor={{ false: '#ccc', true: '#b80000' }}
          thumbColor={vibrationEnabled ? '#c5a34f' : '#f4f3f4'}
          ios_backgroundColor="#ccc"
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Notification Tone</Text>
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
                      (selectedToneFor === 'driver' && item.id === driverTone.id) ||
                      (selectedToneFor === 'app' && item.id === appAlertTone.id)
                        ? styles.selectedToneText
                        : null,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setTonePickerVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#b80000',
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
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  toneSelector: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toneName: {
    color: '#b80000',
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#b80000',
    marginVertical: 25,
    opacity: 0.3,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#b80000',
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
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#b80000',
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
    color: '#333',
  },
  selectedToneText: {
    color: '#b80000',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  modalCloseButton: {
    paddingVertical: 12,
    backgroundColor: '#b80000',
    borderRadius: 8,
    marginTop: 15,
  },
  modalCloseText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

