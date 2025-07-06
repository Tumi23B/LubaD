// Customer Dashboard Screen
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform} from 'react-native';
import { auth, database } from '../firebase';
import { ref, get, onValue } from 'firebase/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard({ navigation }) {
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

  const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';

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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Welcome, {username} 👋</Text>
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
        >
          {location && <Marker coordinate={location} title="You are here" />}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#b80000" />
          )}
        </MapView>

        <TextInput
          placeholder="📍 Pickup Location"
          value={pickup}
          onChangeText={(text) => {
            setPickup(text);
            fetchRoute();
          }}
          style={styles.input}
        />
        <TextInput
          placeholder="📦 Dropoff Location"
          value={dropoff}
          onChangeText={(text) => {
            setDropoff(text);
            fetchRoute();
          }}
          style={styles.input}
        />

        <TouchableOpacity style={styles.timeToggle} onPress={() => setTimeNow(!timeNow)}>
          <Text style={styles.linkText}>{timeNow ? 'Schedule for Later' : 'Use Current Time'}</Text>
        </TouchableOpacity>

        {!timeNow && (
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text>{date.toLocaleString()}</Text>
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
          style={styles.checkoutButton}
          onPress={() =>
            navigation.navigate('Checkout', {
              pickup,
              dropoff,
              date: date.toISOString(),
              vehicle: selectedVehicle,
            })
          }
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Our Vehicles</Text>
        <View style={styles.vehicleGrid}>
          {vehicleOptions.map((v, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.vehicleBox,
                selectedVehicle === v.type && styles.selectedVehicle,
              ]}
              onPress={() => setSelectedVehicle(v.type)}
            >
              <Ionicons name={v.icon} size={30} color="#b80000" />
              <Text style={styles.vehicleLabel}>{v.type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.heading}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BookingHistory')}>
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentRides.length === 0 ? (
          <Text style={{ color: '#555' }}>No recent rides yet.</Text>
        ) : (
          recentRides.map((ride, index) => (
            <View key={index} style={styles.suggestionCard}>
              <Ionicons name="time-outline" size={22} color="#b80000" />
              <Text style={styles.bold}>{ride.pickup} ➡️ {ride.dropoff}</Text>
              <Text style={styles.suggestionDesc}>
                {new Date(ride.date).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Account Settings ⚙️</Text>
        <TouchableOpacity style={styles.settingLink} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={20} color="#b80000" />
          <Text style={styles.settingText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
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
    color: '#b80000',
  },
  /*subtitle: {
    fontSize: 16,
    marginTop: 4,
    color: '#333',
  },*/
  /*heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#b80000',
  },*/
  input: {
    borderWidth: 1,
    borderColor: '#c5a34f',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  timeToggle: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  linkText: {
    color: '#b80000',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  checkoutButton: {
    backgroundColor: '#b80000',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  checkoutButtonText: {
    color: '#c5a34f',
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
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#c5a34f',
  },
  selectedVehicle: {
    borderColor: '#b80000',
    backgroundColor: '#fff8f8',
  },
  vehicleLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  suggestionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bold: {
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  suggestionDesc: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  settingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },
  settingText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});
