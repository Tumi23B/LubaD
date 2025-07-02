import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import { auth, database } from '../firebase';
import { ref, get } from 'firebase/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

export default function Dashboard({ navigation }) {
  const [username, setUsername] = useState('');
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeNow, setTimeNow] = useState(true);
  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  const GOOGLE_MAPS_API_KEY = 'AIzaSyAhSvufBEInpH4J-ug01pOmTix7SFe3hZI';

  useEffect(() => {
    const fetchUserNameAndLocation = async () => {
      const user = auth.currentUser;
      if (user) {
        const snapshot = await get(ref(database, 'users/' + user.uid));
        if (snapshot.exists()) {
          setUsername(snapshot.val().username);
        }
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
    fetchUserNameAndLocation();
  }, []);

  const fetchRoute = async () => {
    if (!pickup || !dropoff) return;

    try {
      const result = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup}&destination=${dropoff}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const points = result.data.routes[0].overview_polyline.points;
      const steps = decodePolyline(points);
      setRouteCoords(steps);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const decodePolyline = (t) => {
    let points = [];
    let index = 0,
      len = t.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const vehicleOptions = [
    { type: 'Mini Van', description: 'Small packages, quick errands' },
    { type: 'Van', description: 'More space, bulky items' },
    { type: 'Mini Truck', description: 'Light furniture, medium appliances' },
    { type: 'Full Truck', description: 'Big moves and large items' },
    { type: 'Passenger Van', description: 'People + belongings' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Welcome, {username} 👋</Text>
        <Text style={styles.subtitle}>Book your delivery or explore your options below.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Go Anywhere with Luba</Text>
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
          {location && <Marker coordinate={location} title="You are here" pinColor="green" />}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#D90D32" />
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

        <TouchableOpacity
          style={styles.timeToggle}
          onPress={() => setTimeNow(!timeNow)}
        >
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
              const currentDate = selectedDate || date;
              setShowDatePicker(Platform.OS === 'ios');
              setDate(currentDate);
            }}
          />
        )}

        <TouchableOpacity style={styles.confirmButton} onPress={fetchRoute}>
          <Text style={styles.confirmButtonText}>See Prices</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Choose a Vehicle</Text>
        {vehicleOptions.map((v, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.vehicleCard, selectedVehicle === v.type && styles.selectedVehicle]}
            onPress={() => setSelectedVehicle(v.type)}
          >
            <Text style={styles.vehicleType}>{v.type}</Text>
            <Text style={styles.vehicleDesc}>{v.description}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Help with loading/unloading?</Text>
          <Switch value={loadingHelp} onValueChange={setLoadingHelp} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Suggestions</Text>
        <View style={styles.suggestionBox}>
          <Text style={styles.bold}>Ride:</Text>
          <Text>Go anywhere with Luba. Request a ride, hop in, and go.</Text>
        </View>
        <View style={styles.suggestionBox}>
          <Text style={styles.bold}>Reserve:</Text>
          <Text>Reserve your ride in advance so you can relax on delivery day.</Text>
        </View>
        <View style={styles.suggestionBox}>
          <Text style={styles.bold}>Courier:</Text>
          <Text>Same-day delivery made simple for your parcels or items.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Want to earn with Luba?</Text>
        <TouchableOpacity style={styles.driverButton} onPress={() => navigation.navigate('DriverApplication')}>
          <Text style={styles.driverButtonText}>Become a Driver 🚗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Account Settings ⚙️</Text>
        <Text style={styles.infoLine}>Username: {username}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 20 },
  section: { marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D90D32' },
  subtitle: { fontSize: 16, marginTop: 4, color: '#333' },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  timeToggle: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  linkText: {
    color: '#D90D32',
    textDecorationLine: 'underline',
  },
  confirmButton: {
    backgroundColor: '#D90D32',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  map: {
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  vehicleCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedVehicle: {
    borderColor: '#D90D32',
    backgroundColor: '#fff8f8',
  },
  vehicleType: { fontWeight: 'bold', fontSize: 16 },
  vehicleDesc: { fontSize: 13, color: '#555' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: { fontSize: 14, color: '#333' },
  driverButton: {
    backgroundColor: '#D90D32',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  driverButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  suggestionBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  bold: { fontWeight: 'bold', marginBottom: 4 },
  infoLine: { fontSize: 14, color: '#333' },
});
