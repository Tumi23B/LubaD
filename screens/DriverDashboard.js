import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { auth, database } from '../firebase';
import { ref, get } from 'firebase/database';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function DriverDashboard({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [driverName, setDriverName] = useState('Driver');
  const [isApproved, setIsApproved] = useState(false);
  const [rides, setRides] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);

  const toggleOnlineStatus = () => setIsOnline(!isOnline);

  useEffect(() => {
    const fetchDriverStatus = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const snapshot = await get(ref(database, 'driverApplications/' + user.uid));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setDriverName(data.fullName || 'Driver');
          setIsApproved(data.status === 'approved');
        }
      } catch (error) {
        console.warn('Error fetching driver data:', error);
        setIsApproved(false);
      }
    };

    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setDriverLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    fetchDriverStatus();
    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {driverName} 👋</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Approval Status:</Text>
        <Text style={[styles.statusText, isApproved ? styles.approved : styles.pending]}>
          {isApproved ? 'Approved' : 'Pending Approval'}
        </Text>
      </View>

      {isApproved ? (
        <>
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsTitle}>Earnings Summary</Text>
            <Text style={styles.earningsAmount}>R 0.00</Text>
          </View>

          <View style={styles.ridesContainer}>
            <Text style={styles.sectionTitle}>Current Rides</Text>
            {rides.length === 0 ? (
              <Text style={styles.noRidesText}>No rides assigned yet.</Text>
            ) : (
              <FlatList
                data={rides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.rideCard}>
                    <Text style={styles.rideCustomer}>{item.customer}</Text>
                    <Text>Pickup: {item.pickup}</Text>
                    <Text>Dropoff: {item.dropoff}</Text>
                    <Text>Status: {item.status}</Text>
                  </View>
                )}
              />
            )}
          </View>

          {driverLocation && (
            <View style={styles.mapContainer}>
              <Text style={styles.sectionTitle}>Navigation</Text>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker coordinate={driverLocation} title="Your Location" pinColor="green" />
              </MapView>
            </View>
          )}

          <TouchableOpacity
            style={[styles.onlineButton, isOnline ? styles.online : styles.offline]}
            onPress={toggleOnlineStatus}
          >
            <Text style={styles.onlineButtonText}>
              {isOnline ? 'Go Offline' : 'Start Driving'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.pendingMessage}>
          Your driver application is being reviewed. Please wait for approval.
        </Text>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          auth.signOut();
          navigation.navigate('Login');
        }}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#D90D32' },
  statusContainer: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  statusLabel: { fontWeight: '600', marginRight: 8 },
  statusText: { fontWeight: 'bold' },
  approved: { color: 'green' },
  pending: { color: 'orange' },
  earningsContainer: {
    marginBottom: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8,
  },
  earningsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  earningsAmount: { fontSize: 24, fontWeight: 'bold', color: '#D90D32' },
  ridesContainer: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  noRidesText: { fontStyle: 'italic', color: '#555' },
  rideCard: {
    padding: 15, marginBottom: 10, backgroundColor: '#fafafa',
    borderRadius: 8, borderWidth: 1, borderColor: '#ddd',
  },
  rideCustomer: { fontWeight: 'bold', marginBottom: 4 },
  mapContainer: {
    height: 250,
    marginTop: 20,
  },
  map: {
    flex: 1,
    borderRadius: 10,
  },
  onlineButton: {
    padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center',
  },
  online: { backgroundColor: '#28a745' },
  offline: { backgroundColor: '#dc3545' },
  onlineButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  pendingMessage: {
    textAlign: 'center', fontSize: 16, color: 'orange', marginTop: 40,
  },
  logoutButton: {
    marginTop: 30, padding: 15, borderRadius: 8,
    backgroundColor: '#D90D32', alignItems: 'center',
  },
  logoutButtonText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
});
