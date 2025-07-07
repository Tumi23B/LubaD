// Customer Dashboard Screen
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { auth, database } from '../firebase';
import { ref, get, onValue } from 'firebase/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';

export default function Dashboard({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme

  const [username, setUsername] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeNow, setTimeNow] = useState(true);
  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [recentRides, setRecentRides] = useState([]);

  const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key

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

  const fetchRoute = async () => {
    if (!pickup || !dropoff) return;

    try {
      const result = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup}&destination=${dropoff}&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (result.data.routes.length > 0) {
        const points = result.data.routes[0].overview_polyline.points;
        const steps = decodePolyline(points);
        setRouteCoords(steps);
      } else {
        setRouteCoords([]);
      }
    } catch (error) {
      console.error('Route error:', error);
    }
  };

  const decodePolyline = (t) => {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const vehicleOptions = [
    { type: 'Mini Van', icon: 'car-outline' },
    { type: 'Van', icon: 'bus-outline' },
    { type: 'Mini Truck', icon: 'cube-outline' },
    { type: 'Full Truck', icon: 'trail-sign-outline' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
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
          customMapStyle={isDarkMode ? mapStyleDark : mapStyleLight} // Apply custom map style based on theme
        >
          {location && <Marker coordinate={location} pinColor={colors.iconRed} title="You are here" />}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={colors.iconRed} />
          )}
        </MapView>

        <TextInput
          placeholder="📍 Pickup Location"
          placeholderTextColor={colors.textSecondary}
          value={pickup}
          onChangeText={(text) => {
            setPickup(text);
            fetchRoute();
          }}
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
          onChangeText={(text) => {
            setDropoff(text);
            fetchRoute();
          }}
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
          <Text style={[styles.linkText, { color: colors.iconRed }]}>{timeNow ? 'Schedule for Later' : 'Use Current Time'}</Text>
        </TouchableOpacity>

        {!timeNow && (
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
            <Text style={{ color: colors.text }}>{date.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, selectedDate) => {
              if (selectedDate) setDate(selectedDate);
              setShowDatePicker(false);
            }}
          />
        )}

        <TouchableOpacity
          style={[styles.checkoutButton, { backgroundColor: colors.iconRed }]}
          onPress={() =>
            navigation.navigate('Checkout', {
              pickup,
              dropoff,
              date: date.toISOString(),
              vehicle: selectedVehicle,
            })
          }
        >
          <Text style={[styles.checkoutButtonText, { color: colors.buttonText }]}>Checkout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, { color: colors.iconRed }]}>Our Vehicles</Text>
        <View style={styles.vehicleGrid}>
          {vehicleOptions.map((v, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.vehicleBox,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.borderColor,
                },
                selectedVehicle === v.type && {
                  borderColor: colors.iconRed,
                  backgroundColor: isDarkMode ? colors.darkHighlight : colors.lightHighlight, // Use distinct highlight colors
                },
              ]}
              onPress={() => setSelectedVehicle(v.type)}
            >
              <Ionicons name={v.icon} size={30} color={colors.iconRed} />
              <Text style={[styles.vehicleLabel, { color: colors.text }]}>{v.type}</Text>
            </TouchableOpacity>
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
              <Text style={[styles.bold, { color: colors.text }]}>{ride.pickup} ➡️ {ride.dropoff}</Text>
              <Text style={[styles.suggestionDesc, { color: colors.textSecondary }]}>
                {new Date(ride.date).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, { color: colors.iconRed }]}>Account Settings ⚙️</Text>
        <TouchableOpacity style={[styles.settingLink, { backgroundColor: colors.cardBackground }]} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={20} color={colors.iconRed} />
          <Text style={[styles.settingText, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const mapStyleLight = [
  // Default light map style
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
  // Dark map style (simplified example, you might need a more comprehensive one)
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
    // backgroundColor handled by theme
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
    // color handled by theme
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    // color handled by theme
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    // borderColor, backgroundColor, color handled by theme
  },
  timeToggle: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  linkText: {
    // color handled by theme
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  checkoutButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    // backgroundColor handled by theme
  },
  checkoutButtonText: {
    // color handled by theme
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
    // backgroundColor, borderColor handled by theme
  },
  // selectedVehicle: { // This will be applied inline
  //   borderColor: '#b80000',
  //   backgroundColor: '#fff8f8',
  // },
  vehicleLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    // color handled by theme
  },
  suggestionCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
    // backgroundColor handled by theme
  },
  bold: {
    fontWeight: 'bold',
    marginTop: 8,
    // color handled by theme
  },
  suggestionDesc: {
    marginTop: 4,
    fontSize: 14,
    // color handled by theme
  },
  settingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    // backgroundColor handled by theme
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    // color handled by theme
  },
});
