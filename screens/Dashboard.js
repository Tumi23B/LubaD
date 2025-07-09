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

export default function Dashboard({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

  const [username, setUsername] = useState('');
  const [autocompleteError, setAutocompleteError] = useState(null);

  // Address inputs & coords
  const [pickup, setPickup] = useState('');
  const [debouncedPickup, setDebouncedPickup] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);

  const [dropoff, setDropoff] = useState('');
  const [debouncedDropoff, setDebouncedDropoff] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [dropoffLoading, setDropoffLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [timeNow, setTimeNow] = useState(true);
  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [recentRides, setRecentRides] = useState([]);

  const geoapifyKey = Constants.expoConfig.extra.GEOAPIFY_API_KEY;

  // Debounce pickup input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPickup(pickup);
    }, 500);
    return () => clearTimeout(handler);
  }, [pickup]);

  // Debounce dropoff input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDropoff(dropoff);
    }, 500);
    return () => clearTimeout(handler);
  }, [dropoff]);

  // Fetch user data and location
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

  // Decode polyline returned by Geoapify
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  // Fetch suggestions from Geoapify autocomplete API
  const fetchGeoapifySuggestions = useCallback(
    async (query, setSuggestions, setLoading) => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      setAutocompleteError(null);
      try {
        const response = await axios.get(
          'https://api.geoapify.com/v1/geocode/autocomplete',
          {
            params: {
              text: query,
              apiKey: geoapifyKey,
              limit: 5,
              filter: 'countrycode:za',
            },
          }
        );
        if (response.data && response.data.features) {
          setSuggestions(response.data.features);
        } else {
          setSuggestions([]);
          setAutocompleteError('No suggestions found');
        }
      } catch (err) {
        console.error('Geoapify autocomplete error:', err);
        setAutocompleteError('Failed to fetch suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [geoapifyKey]
  );

  // Fetch route from Geoapify routing API
  const fetchRoute = useCallback(async () => {
    if (!pickupCoords || !dropoffCoords) {
      setRouteCoords([]);
      return;
    }
    try {
      const start = `${pickupCoords.latitude},${pickupCoords.longitude}`;
      const end = `${dropoffCoords.latitude},${dropoffCoords.longitude}`;
      // Geoapify Directions API endpoint:
   
      const response = await axios.get('https://api.geoapify.com/v1/routing', {
        params: {
          waypoints: `${start}|${end}`,
          mode: 'drive',
          apiKey: geoapifyKey,
          details: 'true',
          geometry_format: 'encodedpolyline',
        },
      });
      console.log('Routing API response:', response.data);
      if (
        response.data &&
        response.data.features &&
        response.data.features.length > 0 &&
        response.data.features[0].properties &&
        response.data.features[0].properties.route_geometry
      ) {
        const encodedPolyline = response.data.features[0].properties.route_geometry;
        const decoded = decodePolyline(encodedPolyline);
        console.log('Decode polyline coordinates:', decoded);
        setRouteCoords(decoded);
      } else {
        setRouteCoords([]);
      }
    } catch (error) {
      //console.error('Please Enter valid locations');
      setRouteCoords([]);
    }
  }, [pickupCoords, dropoffCoords, geoapifyKey]);

  // Trigger suggestions fetch on debounced input changes
  useEffect(() => {
    fetchGeoapifySuggestions(debouncedPickup, setPickupSuggestions, setPickupLoading);
  }, [debouncedPickup, fetchGeoapifySuggestions]);

  useEffect(() => {
    fetchGeoapifySuggestions(debouncedDropoff, setDropoffSuggestions, setDropoffLoading);
  }, [debouncedDropoff, fetchGeoapifySuggestions]);

useEffect(() => {
  if (pickupCoords && dropoffCoords) {
    fetchRoute(); // This calls Geoapify routing API to get directions polyline
  } else {
    setRouteCoords([]); // Clear route if either coordinate is missing
  }
}, [pickupCoords, dropoffCoords, fetchRoute]);
  // On selecting a pickup suggestion
  const onPickupSelect = (item) => {
    setPickup(item.properties.formatted);
    setPickupCoords({
      latitude: item.geometry.coordinates[1],
      longitude: item.geometry.coordinates[0],
    });
    setPickupSuggestions([]);
    setAutocompleteError(null);
  };

  // On selecting a dropoff suggestion
  const onDropoffSelect = (item) => {
    setDropoff(item.properties.formatted);
    setDropoffCoords({
      latitude: item.geometry.coordinates[1],
      longitude: item.geometry.coordinates[0],
    });
    setDropoffSuggestions([]);
    setAutocompleteError(null);
  };

  // Input change handlers
  const onPickupChange = (text) => {
    setPickup(text);
    setPickupCoords(null);
    setPickupSuggestions([]);
    setAutocompleteError(null);
  };

  const onDropoffChange = (text) => {
    setDropoff(text);
    setDropoffCoords(null);
    setDropoffSuggestions([]);
    setAutocompleteError(null);
  };

  // Fetch route whenever coords change
  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      fetchRoute();
    } else {
      setRouteCoords([]);
    }
  }, [pickupCoords, dropoffCoords, fetchRoute]);

  // Date picker handlers
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (selectedDate) => {
    setDate(selectedDate);
    hideDatePicker();
  };

  // Handle checkout button press
  const handleCheckout = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Information', 'Please enter both pickup and dropoff locations');
      return;
    }
    if (!pickupCoords || !dropoffCoords) {
      Alert.alert('Invalid Locations', 'Please select valid locations from the suggestions');
      return;
    }
    navigation.navigate('Checkout', {
      pickup,
      pickupCoords,
      dropoff,
      dropoffCoords,
      date: date.toISOString(),
    });
  };

  // Vehicle options data
  const vehicleOptions = [
    { type: 'Mini Van', icon: 'car-outline' },
    { type: 'Van', icon: 'bus-outline' },
    { type: 'Mini Truck', icon: 'cube-outline' },
    { type: 'Full Truck', icon: 'trail-sign-outline' },
  ];

  // Render autocomplete suggestion item
  const renderSuggestion = (item, onSelect) => (
    <TouchableOpacity
      key={item.properties.place_id || item.properties.osm_id}
      style={[styles.suggestionItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => onSelect(item)}
    >
      <Text style={{ color: colors.text }}>{item.properties.formatted}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
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
            customMapStyle={isDarkMode ? mapStyleDark : mapStyleLight}
          >
            {location && <Marker coordinate={location} pinColor={colors.iconRed} title="You are here" />}
            {pickupCoords && <Marker coordinate={pickupCoords} pinColor="green" title="Pickup" />}
            {dropoffCoords && <Marker coordinate={dropoffCoords} pinColor="blue" title="Dropoff" />}
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={colors.iconRed} />
            )}
          </MapView>

          {/* Pickup input */}
          <View style={{ zIndex: 1000 }}>
            <TextInput
              placeholder="📍 Pickup Location"
              placeholderTextColor={colors.textSecondary}
              value={pickup}
              onChangeText={onPickupChange}
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.borderColor,
                },
              ]}
              returnKeyType="search"
            />
            {pickupLoading && <ActivityIndicator size="small" color={colors.iconRed} />}
            {autocompleteError && pickupSuggestions.length === 0 && (
              <Text style={[styles.errorText, { color: colors.iconRed }]}>{autocompleteError}</Text>
            )}
            {pickupSuggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: colors.cardBackground }]}>
                {pickupSuggestions.map((item) => renderSuggestion(item, onPickupSelect))}
              </View>
            )}
          </View>

          {/* Dropoff input */}
          <View style={{ zIndex: 999 }}>
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
              returnKeyType="search"
            />
            {dropoffLoading && <ActivityIndicator size="small" color={colors.iconRed} />}
            {autocompleteError && dropoffSuggestions.length === 0 && (
              <Text style={[styles.errorText, { color: colors.iconRed }]}>{autocompleteError}</Text>
            )}
            {dropoffSuggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: colors.cardBackground }]}>
                {dropoffSuggestions.map((item) => renderSuggestion(item, onDropoffSelect))}
              </View>
            )}
          </View>

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
            style={[styles.checkoutButton, { backgroundColor: colors.iconRed }]}
            onPress={handleCheckout}
            disabled={!pickupCoords || !dropoffCoords}
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
            <Text style={{ color: colors.textSecondary }}>No recent rides yet.</Text>
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
