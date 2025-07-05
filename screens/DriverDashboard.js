import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { auth, database } from '../firebase';
import { ref, get, update, onValue} from 'firebase/database';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';


export default function DriverDashboard({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [driverName, setDriverName] = useState('Driver');
  const [isApproved, setIsApproved] = useState(false);
  const [rides, setRides] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);

  // logic to update the driver's online status
  const toggleOnlineStatus = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const newStatus = !isOnline;
  setIsOnline(newStatus);

  try {
    await update(ref(database, 'driverStatus/' + user.uid), {
      isOnline: newStatus,
      timestamp: Date.now(),
      location: driverLocation || null,
    });
  } catch (error) {
    console.warn('Failed to update driver status:', error);
    setIsOnline(!newStatus); // rollback UI if update fails
  }
};

// Listen for changes in driver's online status and update local state automatically
useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const statusRef = ref(database, 'driverStatus/' + user.uid);

  const unsubscribe = onValue(statusRef, (snapshot) => {
    const data = snapshot.val();
    if (data?.isOnline !== undefined) {
      setIsOnline(data.isOnline); // Sync local state with Firebase
    }
  });

  return () => unsubscribe(); // Cleanup on unmount
}, []);

// Fetch driver data and location on mount
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

// Fetch rides assigned to the driver uses a efficient listener to only load rides mapped to this driver
useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const driverRidesRef = ref(database, 'driverRides/' + user.uid);

  const unsubscribe = onValue(driverRidesRef, async (snapshot) => {
    const rideKeys = snapshot.val();
    if (!rideKeys) {
      setRides([]);
      return;
    }

    const ridePromises = Object.keys(rideKeys).map(async (rideId) => {
      const rideSnap = await get(ref(database, 'rideRequests/' + rideId));
      return { id: rideId, ...rideSnap.val() };
    });

    const rideData = await Promise.all(ridePromises);
    setRides(rideData);
  });

  return () => unsubscribe();
}, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            {/* Profile & Chat Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => navigation.navigate('DriverProfile')}
              >
                <Text style={styles.buttonText}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => navigation.navigate('DriverChat')}
              >
                <Text style={styles.buttonText}>Chat</Text>
              </TouchableOpacity>
            </View>

            {/* Map */}
            {driverLocation && (
              <View style={styles.mapContainer}>
                <Text style={styles.sectionTitle}>Your Location</Text>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                >
                  <Marker coordinate={driverLocation} title="You" pinColor="#D90D32" />
                </MapView>
              </View>
            )}

            {/* Earnings */}
            <View style={styles.earningsContainer}>
              <Text style={styles.earningsTitle}>Earnings Summary</Text>
              <Text style={styles.earningsAmount}>R 0.00</Text>
            </View>

            {/* Rides */}
            <View style={styles.ridesContainer}>
              <Text style={styles.sectionTitle}>Current Rides</Text>
              {rides.length === 0 ? (
                <Text style={styles.noRidesText}>No rides assigned yet.</Text>
              ) : (
                <FlatList
                  scrollEnabled={false}
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

            {/* Online Button */}
            <TouchableOpacity
              style={styles.statusButton}
              onPress={toggleOnlineStatus}
            >
              <Text style={styles.buttonText}>
                {isOnline ? 'Go Offline' : 'Start Driving'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.pendingMessage}>
            Your driver application is being reviewed. Please wait for approval.
          </Text>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            auth.signOut();
            navigation.navigate('Login');
          }}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    color: '#D90D32',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: { fontWeight: '600', marginRight: 8 },
  statusText: { fontWeight: 'bold' },
  approved: { color: 'green' },
  pending: { color: 'orange' },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#D90D32',
  },
  buttonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },

  mapContainer: {
    height: 250,
    marginBottom: 20,
  },
  map: {
    flex: 1,
    borderRadius: 10,
  },

  earningsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderColor: '#D90D32',
    borderWidth: 1,
  },
  earningsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  earningsAmount: { fontSize: 24, fontWeight: 'bold', color: '#D90D32' },

  ridesContainer: {},
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#D90D32',
  },
  noRidesText: { fontStyle: 'italic', color: '#555' },
  rideCard: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rideCustomer: { fontWeight: 'bold', marginBottom: 4 },

  statusButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#D90D32',
  },

  pendingMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: 'orange',
    marginTop: 40,
  },

  logoutButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#D90D32',
    alignItems: 'center',
  },
});
