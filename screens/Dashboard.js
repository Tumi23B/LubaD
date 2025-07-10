import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView as RNScrollView,
} from 'react-native';
import { auth, database } from '../firebase';
import { ref, get, onValue } from 'firebase/database';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';
import Constants from 'expo-constants';
import { Linking } from 'react-native';


export default function Dashboard({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

 const [username, setUsername] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [location, setLocation] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [timeNow, setTimeNow] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const snapshot = await get(ref(database, 'users/' + user.uid));
        if (snapshot.exists()) {
          setUsername(snapshot.val().username);
        }
        const ridesRef = ref(database, `rides/${user.uid}`);
        onValue(ridesRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const rideList = Object.values(data).reverse().slice(0, 5);
            setRecentRides(rideList);
          }
        });
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission denied.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    };

    fetchUserData();
  }, []);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (selectedDate) => {
    setDate(selectedDate);
    hideDatePicker();
  };

  const handleCheckout = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Information', 'Please enter both pickup and dropoff locations');
      return;
    }

    navigation.navigate('Checkout', {
      pickup,
      dropoff,
      date: date.toISOString(),
    });
  };

  const openGoogleMapsNavigation = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Information', 'Please enter both pickup and dropoff locations.');
      return;
    }

    const origin = encodeURIComponent(pickup);
    const destination = encodeURIComponent(dropoff);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;

    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open Google Maps.')
    );
  };

  const onDropoffChange = (text) => {
    setDropoff(text);
  };

  const vehicleOptions = [
    { type: 'Mini Van', icon: 'car-outline' },
    { type: 'Van', icon: 'bus-outline' },
    { type: 'Mini Truck', icon: 'cube-outline' },
    { type: 'Full Truck', icon: 'trail-sign-outline' },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.iconRed }]}>Welcome, {username} 👋</Text>
        </View>

        <View style={styles.section}>
          <MapView
            style={styles.map}
            region={
              location
                ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
                : {
                    latitude: -26.2041,
                    longitude: 28.0473,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                  }
            }
            customMapStyle={Platform.OS === 'ios' ? mapStyleDark : mapStyleLight}
          >
            {location && <Marker coordinate={location} pinColor={colors.iconRed} title="You are here" />}
          </MapView>

          <TextInput
            placeholder="📍 Pickup Location"
            placeholderTextColor={colors.textSecondary}
            value={pickup}
            onChangeText={setPickup}
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
          />

          <TextInput
            placeholder="📦 Dropoff Location"
            placeholderTextColor={colors.textSecondary}
            value={dropoff}
            onChangeText={onDropoffChange}
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
          />

          <TouchableOpacity style={styles.timeToggle} onPress={() => setTimeNow(!timeNow)}>
            <Text style={[styles.linkText, { color: colors.iconRed }]}>
              {timeNow ? 'Schedule for Later' : 'Use Current Time'}
            </Text>
          </TouchableOpacity>

          {!timeNow && (
            <TouchableOpacity
              onPress={showDatePicker}
              style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}
            >
              <Text style={{ color: colors.text }}>{date.toLocaleString()}</Text>
            </TouchableOpacity>
          )}

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />

            <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: '#4285F4' }]}
            onPress={openGoogleMapsNavigation}
          >
            <Text style={[styles.checkoutButtonText, { color: 'white' }]}>
              Open Route in Google Maps
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: colors.iconRed }]}
            onPress={handleCheckout}
          >
            <Text style={[styles.checkoutButtonText, { color: colors.buttonText }]}>Checkout</Text>
          </TouchableOpacity>

         
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.iconRed }]}>Available Vehicle Types</Text>
          <View style={styles.vehicleGrid}>
            {vehicleOptions.map((v, i) => (
              <View
                key={i}
                style={[
                  styles.vehicleBox,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                <Ionicons name={v.icon} size={30} color={colors.iconRed} />
                <Text style={[styles.vehicleLabel, { color: colors.text }]}>{v.type}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.heading, { color: colors.iconRed }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BookingHistory')}>
              <Text style={[styles.linkText, { color: colors.iconRed }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentRides.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>View recent rides</Text>
          ) : (
            recentRides.map((ride, index) => (
              <View key={index} style={[styles.suggestionCard, { backgroundColor: colors.cardBackground }]}>
                <Ionicons name="time-outline" size={22} color={colors.iconRed} />
                <Text style={[styles.bold, { color: colors.text }]}>
                  {ride.pickup} ➡️ {ride.dropoff}
                </Text>
                <Text style={[styles.suggestionDesc, { color: colors.textSecondary }]}>
                  {new Date(ride.date).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.iconRed }]}>Account Settings ⚙️</Text>
          <TouchableOpacity
            style={[styles.settingLink, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.iconRed} />
            <Text style={[styles.settingText, { color: colors.text }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const mapStyleLight = [
  {
   

    "featureType": "poi",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  }
];

const mapStyleDark = [
    {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#746855"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#242f3e"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#d59563"
      }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#38414e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#212a37"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9ca5b3"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#746855"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#1f2835"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#f3d19c"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#515c6d"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#17263c"
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  timeToggle: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  checkoutButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  checkoutButtonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  map: {
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vehicleBox: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  vehicleLabel: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  suggestionCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bold: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  suggestionDesc: {
    marginTop: 4,
    fontSize: 14,
  },
  settingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionsContainer: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  suggestionItem: {
    padding: 10,
  },
});
