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
import { ref, get, onValue, push, set } from 'firebase/database';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';
import Constants from 'expo-constants';
import { Image } from 'react-native';
import { Linking } from 'react-native';
import { LogBox } from 'react-native';


// Ignore specific warning messages
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

{/*Or ignore all logs (not recommended unless you're demoing)
LogBox.ignoreAllLogs(true);*/}


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
  const [rideId, setRideId] = useState(null);

  

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

   const sendRideRequest = async (pickup, dropoff, pickupCoords, dropoffCoords, customerId) => {
  const rideRef = push(ref(database, 'rides'));
  await set(rideRef, {
    customerId,
    driverId: null,
    pickup,
    dropoff,
    pickupCoords,
    dropoffCoords,
    status: 'requested',
    timestamp: Date.now(),
    driverLocation: null,
  });
  return rideRef.key;
};

const getCoordsFromAddress = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'YourAppName/1.0 (LubaD)', 
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Geocoding failed: ' + response.statusText);
  }

  const data = await response.json();

  if (data.length === 0) {
    throw new Error('Please Enter Valid Addresses!');
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
};




  const handleCheckout = async () => {
  if (!pickup || !dropoff) {
    Alert.alert('Missing Information', 'Please enter both pickup and dropoff locations');
    return;
  }

  const customerId = auth.currentUser?.uid;
  if (!customerId) {
    Alert.alert('Error', 'User not logged in');
    return;
  }

  try {
  const pickupCoords = await getCoordsFromAddress(pickup);
  const dropoffCoords = await getCoordsFromAddress(dropoff);

  const rideId = await sendRideRequest(pickup, dropoff, pickupCoords, dropoffCoords, customerId);

  navigation.navigate('Checkout', {
    
    username: username,
    pickup,
    dropoff,
    date: date.toISOString(),
    rideId,
  });
} catch (error) {
  //console.error('Error in handleCheckout:', error);
  Alert.alert('Error', error.message || 'Failed to send ride request');
}

};

{


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
    { type: 'Vans', icon: require('../assets/minivan.png')},
    { type: 'Bakkies', icon: require('../assets/van.png') },
    { type: 'Passanger Vans', icon: require('../assets/van.png') },
   
    { type: 'Full & Mini Trucks', icon: require('../assets/fulltruck.png') },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.iconRed }]}>Welcome, {username}!</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsIcon}
          >
            <Ionicons name="settings-outline" size={26} color={colors.iconRed} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.borderColor,
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 20,
              backgroundColor: colors.cardBackground,
              elevation: Platform.OS === 'android' ? 3 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          >
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
              {location && (
                <Marker coordinate={location} pinColor={colors.iconRed} title="You are here" />
              )}
            </MapView>
          </View>

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
                <Image source={v.icon} style={{ width: 30, height: 30 }} />
                <Text style={[styles.vehicleLabel, { color: colors.text }]}>{v.type}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: colors.iconRed }]}>View Requests</Text>
            <TouchableOpacity
              style={[styles.checkoutButton, { backgroundColor: colors.iconRed }]}
              onPress={() => navigation.navigate('BookingHistory')}
            >
              <Text style={[styles.checkoutButtonText, { color: colors.buttonText }]}>Booking History</Text>
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
    marginTop: 6,
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
    marginBottom: 2,
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
  headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 10,
  marginBottom: 20,
},

settingsIcon: {
  padding: 6,
  marginTop: 14,
},

});
