import React, { useEffect, useState, useContext } from 'react';
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
  FlatList,
  Image,
  Linking,
  LogBox
} from 'react-native';
import { auth, database } from '../firebase';
import { ref, get, onValue, push, set } from 'firebase/database';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';

// Ignore specific warning messages
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
  'VirtualizedLists should never be nested'
]);

export default function Dashboard({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

  const [username, setUsername] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [location, setLocation] = useState(null);
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [timeNow, setTimeNow] = useState(true);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);


  
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const snapshot = await get(ref(database, 'users/' + user.uid));
        if (snapshot.exists()) {
          setUsername(snapshot.val().username);
        }
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for this app to work properly');
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

const calculateDistanceAndDuration = (start, end) => {
  // 1. Calculate straight-line distance (Haversine formula)
  const R = 6371; // Earth radius in km
  const dLat = (end.latitude - start.latitude) * Math.PI / 180;
  const dLon = (end.longitude - start.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(start.latitude * Math.PI / 180) * 
    Math.cos(end.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const straightLineDistance = R * c;

  //Apply South Africa-specific adjustments
  const distanceMultiplier = 1.55; // +55% for SA road curves/highways
  const roadDistance = straightLineDistance * distanceMultiplier;

  //  Smart duration estimation (urban/rural adjusted)
  const baseSpeed = 0.9; // km/min (20-90 km/h avg in urban areas)
  let durationMinutes = Math.round(roadDistance / baseSpeed);
  
  // Ensuring minimum 5 minutes for short trips
  durationMinutes = Math.max(5, durationMinutes);

  // Set values with precision
  setDistance(roadDistance.toFixed(1));
  setDuration(durationMinutes);

  // For debugging/transparency:
  console.log(`Straight-line: ${straightLineDistance.toFixed(1)}km | Road: ${roadDistance.toFixed(1)}km`);
};

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (selectedDate) => {
    setDate(selectedDate);
    hideDatePicker();
  };

  const fetchLocationSuggestions = async (query) => {
    if (query.length < 3) return [];
    
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0 (lubadapp@gmail.com)',
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(item => ({
          id: item.place_id,
          displayName: item.display_name,
          coords: {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          }
        }));
      }
      return [];
    } catch (error) {
      console.error('Nominatim API Error:', error);
      return [];
    }
  };

  const handlePickupChange = async (text) => {
    setPickup(text);
    if (text.length > 2) {
      try {
        const suggestions = await fetchLocationSuggestions(text);
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      } catch (error) {
        console.error('Error in pickup suggestions:', error);
      }
    } else {
      setShowPickupSuggestions(false);
    }
  };

  const handleDropoffChange = async (text) => {
    setDropoff(text);
    if (text.length > 2) {
      try {
        const suggestions = await fetchLocationSuggestions(text);
        setDropoffSuggestions(suggestions);
        setShowDropoffSuggestions(true);
      } catch (error) {
        console.error('Error in dropoff suggestions:', error);
      }
    } else {
      setShowDropoffSuggestions(false);
    }
  };

  const selectPickupSuggestion = (suggestion) => {
    setPickup(suggestion.displayName);
    setPickupCoords(suggestion.coords);
    setShowPickupSuggestions(false);
    if (dropoffCoords) {
      calculateDistanceAndDuration(suggestion.coords, dropoffCoords);
      setRouteCoordinates([suggestion.coords, dropoffCoords]);
    }
  };

  const selectDropoffSuggestion = (suggestion) => {
    setDropoff(suggestion.displayName);
    setDropoffCoords(suggestion.coords);
    setShowDropoffSuggestions(false);
    if (pickupCoords) {
      calculateDistanceAndDuration(pickupCoords, suggestion.coords);
      setRouteCoordinates([pickupCoords, suggestion.coords]);
    }
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
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0 (lubadapp@gmail.com',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.data || response.data.length === 0) {
        throw new Error('Address not found');
      }

      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
      };
    } catch (error) {
      console.error('Geocoding Error:', {
        address,
        message: error.message,
        response: error.response?.data
      });
      throw new Error('Failed to get coordinates for address');
    }
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
      setLoading(true);
      const pickupCoords = await getCoordsFromAddress(pickup);
      const dropoffCoords = await getCoordsFromAddress(dropoff);

      const rideId = await sendRideRequest(pickup, dropoff, pickupCoords, dropoffCoords, customerId);

      navigation.navigate('Checkout', {
        username: username,
        pickup,
        dropoff,
        date: date.toISOString(),
        rideId,
        pickupCoords,
        dropoffCoords,
        distance: parseFloat(distance),
        duration: duration
      });
    } catch (error) {
      console.error('Checkout Error:', error);
      Alert.alert('Error', error.message || 'Failed to send ride request');
    } finally {
      setLoading(false);
    }
  };

  const openMapsNavigation = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Information', 'Please enter both pickup and dropoff locations.');
      return;
    }

    const origin = encodeURIComponent(pickup);
    const destination = encodeURIComponent(dropoff);
    
    const url = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?daddr=${destination}&saddr=${origin}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    Linking.openURL(url).catch((error) => {
      console.error('Failed to open maps:', error);
      Alert.alert('Error', `Could not open ${Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps'}.`);
    });
  };

  const renderSuggestionItem = ({ item, isPickup }) => (
    <TouchableOpacity 
      style={[styles.suggestionItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => isPickup ? selectPickupSuggestion(item) : selectDropoffSuggestion(item)}
    >
      <Text style={{ color: colors.text }} numberOfLines={1}>
        {item.displayName}
      </Text>
    </TouchableOpacity>
  );

  const renderLocationInput = (isPickup) => {
    const suggestions = isPickup ? pickupSuggestions : dropoffSuggestions;
    const showSuggestions = isPickup ? showPickupSuggestions : showDropoffSuggestions;
    const value = isPickup ? pickup : dropoff;
    const onChangeText = isPickup ? handlePickupChange : handleDropoffChange;
    const placeholder = isPickup ? '📍 Pickup Location' : '📦 Dropoff Location';

    return (
      <View>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => (isPickup ? setShowPickupSuggestions(true) : setShowDropoffSuggestions(true))}
          onBlur={() => setTimeout(() => isPickup ? setShowPickupSuggestions(false) : setShowDropoffSuggestions(false), 200)}
          style={[
            styles.input,
            {
              backgroundColor: colors.cardBackground,
              color: colors.text,
              borderColor: colors.borderColor,
            },
          ]}
        />
        {showSuggestions && (
          <FlatList
            data={suggestions}
            renderItem={({ item }) => renderSuggestionItem({ item, isPickup })}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            style={[styles.suggestionsContainer, { 
              borderColor: colors.borderColor,
              maxHeight: suggestions.length > 2 ? 150 : suggestions.length * 50 
            }]}
          />
        )}
      </View>
    );
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
              customMapStyle={isDarkMode ? mapStyleDark : mapStyleLight}
            >
              {location && (
                <Marker coordinate={location} pinColor={colors.iconRed} title="You are here" />
              )}
              {pickupCoords && (
                <Marker
                  coordinate={pickupCoords}
                  pinColor="#4285F4"
                  title="Pickup Location"
                />
              )}
              {dropoffCoords && (
                <Marker
                  coordinate={dropoffCoords}
                  pinColor={colors.iconRed}
                  title="Dropoff Location"
                />
              )}
              {routeCoordinates.length > 1 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor={colors.iconRed}
                  strokeWidth={3}
                />
              )}
            </MapView>
            {(distance && duration) && (
              <View style={styles.routeInfoContainer}>
                <Text style={[styles.routeInfoText, { color: colors.text }]}>
                  Distance: {distance} km
                </Text>
                <Text style={[styles.routeInfoText, { color: colors.text }]}>
                  Est. time: {duration} min
                </Text>
              </View>
            )}
          </View>

          {renderLocationInput(true)}
          {renderLocationInput(false)}

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
            onPress={openMapsNavigation}
            disabled={!pickup || !dropoff}
          >
            <Text style={[styles.checkoutButtonText, { color: 'white' }]}>
              Open Route in {Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkoutButton, { backgroundColor: colors.iconRed }]}
            onPress={handleCheckout}
            disabled={loading || !pickup || !dropoff}
          >
            {loading ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={[styles.checkoutButtonText, { color: colors.buttonText }]}>Checkout</Text>
            )}
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
  routeInfoContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});