import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { auth, database } from '../firebase';
import { ref, get, update, onValue } from 'firebase/database';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { ThemeContext } from '../ThemeContext';

export default function DriverDashboard({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme

  const [isOnline, setIsOnline] = useState(false);
  const [driverName, setDriverName] = useState('Driver');
  const [isApproved, setIsApproved] = useState(false);
  const [rides, setRides] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

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
    // Fetch earnings for the driver
    const fetchEarnings = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const earningsSnap = await get(ref(database, 'driverEarnings/' + user.uid));
        if (earningsSnap.exists()) {
          const earnings = earningsSnap.val();
          setTotalEarnings(earnings.total || 0);
        }
      } catch (error) {
        console.warn('Error fetching earnings:', error);
        setTotalEarnings(0); // fallback
      }
    };

    fetchEarnings();
    // Fetch driverlocation
    getLocation();
  }, []);

  // Fetch rides assigned to the driver uses an efficient listener to only load rides mapped to this driver
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

  // Ride Management Functions
  const acceptRide = async (rideId) => {
    try {
      await update(ref(database, 'rideRequests/' + rideId), {
        status: 'accepted',
        acceptedAt: Date.now(),
      });
    } catch (error) {
      console.warn('Error accepting ride:', error);
    }
  };

  const declineRide = async (rideId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await update(ref(database, 'rideRequests/' + rideId), {
        status: 'unassigned',
        driverId: null,
      });

      await update(ref(database, 'driverRides/' + user.uid), {
        [rideId]: null,
      });
    } catch (error) {
      console.warn('Error declining ride:', error);
    }
  };

  const completeRide = async (rideId) => {
    try {
      await update(ref(database, 'rideRequests/' + rideId), {
        status: 'completed',
        completedAt: Date.now(),
      });
    } catch (error) {
      console.warn('Error completing ride:', error);
    }
  };

  // Location updates for the driver. This will run every 10 seconds to update the driver's location in Firebase. Only runs if the driver is online
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !isOnline) return;

    let locationInterval;

    const startLocationUpdates = () => {
      locationInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          // Update Firebase location
          await update(ref(database, 'driverStatus/' + user.uid), {
            location: coords,
            timestamp: Date.now(),
          });

          // Optionally update state if you want to reflect latest location locally
          setDriverLocation(coords);
        } catch (error) {
          console.warn('Error updating location:', error);
        }
      }, 10000); // every 10 seconds
    };

    startLocationUpdates();

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [isOnline]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.iconRed }]}>Welcome, {driverName} 👋</Text>

        <View style={styles.statusContainer}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Approval Status:</Text>
          <Text style={[styles.statusText, isApproved ? styles.approved : styles.pending]}>
            {isApproved ? 'Approved' : 'Pending Approval'}
          </Text>
        </View>

        {isApproved ? (
          <>
            {/* Profile & Chat Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: colors.iconRed }]}
                onPress={() => navigation.navigate('DriverProfile')}
              >
                <Text style={[styles.buttonText, { color: colors.buttonText }]}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: colors.iconRed }]}
                onPress={() => navigation.navigate('DriverChat')}
              >
                <Text style={[styles.buttonText, { color: colors.buttonText }]}>Chat</Text>
              </TouchableOpacity>
            </View>

            {/* Map */}
            {driverLocation && (
              <View style={styles.mapContainer}>
                <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>Your Location</Text>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  customMapStyle={isDarkMode ? mapStyleDark : mapStyleLight} // Apply custom map style based on theme
                >
                  <Marker coordinate={driverLocation} title="You" pinColor={colors.iconRed} />
                </MapView>
              </View>
            )}

            {/* Earnings */}
            <View style={[styles.earningsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
              <Text style={[styles.earningsTitle, { color: colors.text }]}>Earnings Summary</Text>
              <Text style={[styles.earningsAmount, { color: colors.iconRed }]}>R {totalEarnings.toFixed(2)}</Text>
            </View>

            {/* Rides */}
            <View style={styles.ridesContainer}>
              <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>Current Rides</Text>
              {rides.length === 0 ? (
                <Text style={[styles.noRidesText, { color: colors.textSecondary }]}>No rides assigned yet.</Text>
              ) : (
                <FlatList
                  scrollEnabled={false}
                  data={rides}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.rideCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
                      <Text style={[styles.rideCustomer, { color: colors.text }]}>{item.customer}</Text>
                      <Text style={{ color: colors.text }}>Pickup: {item.pickup}</Text>
                      <Text style={{ color: colors.text }}>Dropoff: {item.dropoff}</Text>
                      <Text style={{ color: colors.text }}>Status: {item.status}</Text>

                      {/* Conditional buttons based on ride status */}
                      {item.status === 'assigned' && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.success }]}
                            onPress={() => acceptRide(item.id)}
                          >
                            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Accept</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.secondaryButton }]}
                            onPress={() => declineRide(item.id)}
                          >
                            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {item.status === 'accepted' && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.primaryButton, marginTop: 10 }]}
                          onPress={() => completeRide(item.id)}
                        >
                          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Mark as Complete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                />
              )}
            </View>

            {/* Online Button */}
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: isOnline ? colors.warning : colors.iconRed }]}
              onPress={toggleOnlineStatus}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {isOnline ? 'Go Offline' : 'Start Driving'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={[styles.pendingMessage, { color: colors.warning }]}>
            Your driver application is being reviewed. Please wait for approval.
          </Text>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.iconRed }]}
          onPress={() => {
            auth.signOut();
            navigation.navigate('Login');
          }}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Logout</Text>
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
  scrollContainer: {
    paddingBottom: 40,
  },
  container: {
    padding: 20,
    // backgroundColor handled by theme
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'center',
    // color handled by theme
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontWeight: '600',
    marginRight: 8,
    // color handled by theme
  },
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
    // backgroundColor handled by theme
  },
  buttonText: {
    // color handled by theme
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
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor, borderColor handled by theme
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    // color handled by theme
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    // color handled by theme
  },

  ridesContainer: {},
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    // color handled by theme
  },
  noRidesText: {
    fontStyle: 'italic',
    // color handled by theme
  },
  rideCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor, borderColor handled by theme
  },
  rideCustomer: {
    fontWeight: 'bold',
    marginBottom: 4,
    // color handled by theme
  },

  statusButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    // backgroundColor handled by theme (dynamic based on isOnline)
  },

  pendingMessage: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
    // color handled by theme
  },

  logoutButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    // backgroundColor handled by theme
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  actionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center',
    // backgroundColor handled by theme
  },
});
