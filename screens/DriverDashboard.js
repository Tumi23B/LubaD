import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, ScrollView, Modal } from 'react-native';
// Import Firebase auth and database instances from your central firebase.js file
import { auth, database } from '../firebase'; // <--- UPDATED: Import from your firebase.js

// Firebase imports for Realtime Database functions (still needed for ref, get, update, onValue, remove)
import { ref, get, update, onValue, remove } from 'firebase/database';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth'; // Specific auth functions
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { ThemeContext } from '../ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function DriverDashboard({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

  const [isOnline, setIsOnline] = useState(false);
  const [driverName, setDriverName] = useState('Driver');
  const [isApproved, setIsApproved] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [assignedRides, setAssignedRides] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  // Firebase state
  // db and auth are now directly imported, no longer managed by useState here for initialization
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Modal state for custom alerts/confirmations
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [modalAction, setModalAction] = useState(null);

  // Initialize Firebase and authenticate
  useEffect(() => {
    // No need for initializeApp or parsing firebaseConfig here, as it's done in firebase.js
    try {
      // Use the imported 'auth' instance directly
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => { // <--- UPDATED: Use imported 'auth'
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(auth, __initial_auth_token); // <--- UPDATED: Use imported 'auth'
            } else {
              await signInAnonymously(auth); // <--- UPDATED: Use imported 'auth'
            }
          } catch (error) {
            console.error("Firebase authentication error:", error);
            setModalMessage(`Authentication failed: ${error.message}`);
            setModalType('error');
            setShowModal(true);
            setIsAuthReady(true);
            setLoading(false);
          }
        }
      });

      return () => unsubscribeAuth();
    } catch (error) {
      console.error("Error initializing Firebase (from imported services):", error);
      setModalMessage(`Firebase initialization error: ${error.message}`);
      setModalType('error');
      setShowModal(true);
      setLoading(false);
      setIsAuthReady(true);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Fetch driver data, earnings, and initial location
  useEffect(() => {
    // Use the imported 'database' and 'auth' instances directly
    if (!isAuthReady || !database || !userId) return; // <--- UPDATED: Use imported 'database'

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const fetchDriverProfileAndEarnings = async () => {
      try {
        const driverAppSnap = await get(ref(database, `driverApplications/${userId}`)); // <--- UPDATED: Use imported 'database'
        if (driverAppSnap.exists()) {
          const data = driverAppSnap.val();
          setDriverName(data.fullName || 'Driver');
          setIsApproved(data.status === 'approved');
        }

        const earningsSnap = await get(ref(database, `driverEarnings/${userId}`)); // <--- UPDATED: Use imported 'database'
        if (earningsSnap.exists()) {
          const earnings = earningsSnap.val();
          setTotalEarnings(earnings.total || 0);
        }
      } catch (error) {
        console.warn('Error fetching driver data or earnings:', error);
      }
    };

    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setModalMessage('Location permission is required to use the driver dashboard.');
        setModalType('error');
        setShowModal(true);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setDriverLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    fetchDriverProfileAndEarnings();
    getLocation();
    setLoading(false);
  }, [isAuthReady, database, userId]); // <--- UPDATED: Depend on imported 'database'

  // Listen for changes in driver's online status
  useEffect(() => {
    // Use the imported 'database' instance directly
    if (!isAuthReady || !database || !userId) return; // <--- UPDATED: Use imported 'database'

    const statusRef = ref(database, `driverStatus/${userId}`); // <--- UPDATED: Use imported 'database'
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.isOnline !== undefined) {
        setIsOnline(data.isOnline);
      }
    });
    return () => unsubscribe();
  }, [isAuthReady, database, userId]); // <--- UPDATED: Depend on imported 'database'

  // Listen for pending ride requests
  useEffect(() => {
    // Use the imported 'database' instance directly
    if (!isAuthReady || !database || !userId || !isApproved || !isOnline) { // <--- UPDATED: Use imported 'database'
      setPendingRequests([]);
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const pendingRequestsRef = ref(database, `artifacts/${appId}/ride_requests`); // <--- UPDATED: Use imported 'database'

    const unsubscribe = onValue(pendingRequestsRef, (snapshot) => {
      const data = snapshot.val();
      const requestsList = [];
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (value.status === 'pending') {
            requestsList.push({ id: key, ...value });
          }
        });
      }
      setPendingRequests(requestsList.reverse());
    }, (error) => {
      console.error("Error fetching pending requests:", error);
      setModalMessage(`Failed to load new requests: ${error.message}`);
      setModalType('error');
      setShowModal(true);
    });

    return () => unsubscribe();
  }, [isAuthReady, database, userId, isApproved, isOnline]); // <--- UPDATED: Depend on imported 'database'

  // Listen for assigned rides (rides accepted by this driver)
  useEffect(() => {
    // Use the imported 'database' instance directly
    if (!isAuthReady || !database || !userId || !isApproved) { // <--- UPDATED: Use imported 'database'
      setAssignedRides([]);
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const allRideRequestsRef = ref(database, `artifacts/${appId}/ride_requests`); // <--- UPDATED: Use imported 'database'

    const unsubscribe = onValue(allRideRequestsRef, (snapshot) => {
      const data = snapshot.val();
      const assignedList = [];
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (value.driverId === userId && value.status !== 'completed' && value.status !== 'declined') {
            assignedList.push({ id: key, ...value });
          }
        });
      }
      setAssignedRides(assignedList.reverse());
    }, (error) => {
      console.error("Error fetching assigned rides:", error);
      setModalMessage(`Failed to load assigned rides: ${error.message}`);
      setModalType('error');
      setShowModal(true);
    });

    return () => unsubscribe();
  }, [isAuthReady, database, userId, isApproved]); // <--- UPDATED: Depend on imported 'database'


  // Logic to update the driver's online status
  const toggleOnlineStatus = async () => {
    // Use the imported 'database' and 'auth' instances directly
    if (!userId || !database) return; // <--- UPDATED: Use imported 'database'

    const newStatus = !isOnline;
    setIsOnline(newStatus);

    try {
      const driverStatusRef = ref(database, `driverStatus/${userId}`); // <--- UPDATED: Use imported 'database'
      await update(driverStatusRef, {
        isOnline: newStatus,
        timestamp: Date.now(),
        location: driverLocation || null,
      });
      if (!newStatus) {
        setPendingRequests([]);
        setAssignedRides([]);
      }
    } catch (error) {
      console.warn('Failed to update driver status:', error);
      setIsOnline(!newStatus);
      setModalMessage(`Failed to change online status: ${error.message}`);
      setModalType('error');
      setShowModal(true);
    }
  };

  // Location updates for the driver.
  useEffect(() => {
    // Use the imported 'database' instance directly
    if (!isAuthReady || !database || !userId || !isOnline) return; // <--- UPDATED: Use imported 'database'

    let locationInterval;

    const startLocationUpdates = () => {
      locationInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          const driverStatusRef = ref(database, `driverStatus/${userId}`); // <--- UPDATED: Use imported 'database'
          await update(driverStatusRef, {
            location: coords,
            timestamp: Date.now(),
          });
          setDriverLocation(coords);
        } catch (error) {
          console.warn('Error updating location:', error);
        }
      }, 10000);
    };

    startLocationUpdates();

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [isOnline, isAuthReady, database, userId]); // <--- UPDATED: Depend on imported 'database'

  // Ride Management Functions
  const acceptRide = async (request) => {
    // Use the imported 'database' instance directly
    if (!userId || !database || !driverName) { // <--- UPDATED: Use imported 'database'
      setModalMessage("Driver data not ready. Cannot accept ride.");
      setModalType('error');
      setShowModal(true);
      return;
    }

    setModalMessage(`Accepting ride from ${request.pickup} to ${request.dropoff}. Confirm?`);
    setModalType('confirm');
    setModalAction(() => async () => {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        const publicRequestRef = ref(database, `artifacts/${appId}/ride_requests/${request.id}`); // <--- UPDATED: Use imported 'database'
        await update(publicRequestRef, {
          status: 'accepted',
          driverId: userId,
          driverName: driverName,
          acceptedAt: new Date().toISOString(),
        });

        if (request.customerId && request.customerBookingId) {
          const customerBookingRef = ref(database, `artifacts/${appId}/users/${request.customerId}/rides/${request.customerBookingId}`); // <--- UPDATED: Use imported 'database'
          await update(customerBookingRef, {
            status: 'accepted',
            driverId: userId,
            driverName: driverName,
            acceptedAt: new Date().toISOString(),
          });
        } else {
          console.warn("Missing customerId or customerBookingId for accepted ride:", request);
          setModalMessage("Ride accepted, but customer's record could not be updated fully.");
          setModalType('info');
          setShowModal(true);
        }

        setModalMessage("Ride accepted successfully!");
        setModalType('success');
        setShowModal(true);
      } catch (error) {
        console.error('Error accepting ride:', error);
        setModalMessage(`Failed to accept ride: ${error.message}`);
        setModalType('error');
        setShowModal(true);
      }
    });
    setShowModal(true);
  };

  const declineRide = async (request) => {
    // Use the imported 'database' instance directly
    if (!userId || !database) return; // <--- UPDATED: Use imported 'database'

    setModalMessage(`Decline ride from ${request.pickup} to ${request.dropoff}?`);
    setModalType('confirm');
    setModalAction(() => async () => {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        const publicRequestRef = ref(database, `artifacts/${appId}/ride_requests/${request.id}`); // <--- UPDATED: Use imported 'database'
        await update(publicRequestRef, {
          status: 'declined',
          declinedBy: userId,
          declinedAt: new Date().toISOString(),
        });

        if (request.customerId && request.customerBookingId) {
          const customerBookingRef = ref(database, `artifacts/${appId}/users/${request.customerId}/rides/${request.customerBookingId}`); // <--- UPDATED: Use imported 'database'
          await update(customerBookingRef, {
            status: 'driver_declined',
          });
        }

        setModalMessage("Ride declined.");
        setModalType('info');
        setShowModal(true);
      } catch (error) {
        console.error('Error declining ride:', error);
        setModalMessage(`Failed to decline ride: ${error.message}`);
        setModalType('error');
        setShowModal(true);
      }
    });
    setShowModal(true);
  };

  const completeRide = async (ride) => {
    // Use the imported 'database' instance directly
    if (!userId || !database) return; // <--- UPDATED: Use imported 'database'

    setModalMessage(`Mark ride from ${ride.pickup} to ${ride.dropoff} as complete?`);
    setModalType('confirm');
    setModalAction(() => async () => {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        const publicRequestRef = ref(database, `artifacts/${appId}/ride_requests/${ride.id}`); // <--- UPDATED: Use imported 'database'
        await update(publicRequestRef, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });

        if (ride.customerId && ride.customerBookingId) {
          const customerBookingRef = ref(database, `artifacts/${appId}/users/${ride.customerId}/rides/${ride.customerBookingId}`); // <--- UPDATED: Use imported 'database'
          await update(customerBookingRef, {
            status: 'completed',
            completedAt: new Date().toISOString(),
          });
        }

        const driverEarningsRef = ref(database, `driverEarnings/${userId}`); // <--- UPDATED: Use imported 'database'
        const currentEarningsSnap = await get(driverEarningsRef);
        const currentTotal = currentEarningsSnap.exists() ? currentEarningsSnap.val().total || 0 : 0;
        const ridePrice = ride.price || 100;
        await update(driverEarningsRef, {
          total: currentTotal + ridePrice,
          lastUpdated: new Date().toISOString(),
        });
        setTotalEarnings(currentTotal + ridePrice);

        setModalMessage("Ride completed successfully! Earnings updated.");
        setModalType('success');
        setShowModal(true);
      } catch (error) {
        console.error('Error completing ride:', error);
        setModalMessage(`Failed to complete ride: ${error.message}`);
        setModalType('error');
        setShowModal(true);
      }
    });
    setShowModal(true);
  };

  const handleModalConfirm = () => {
    if (modalAction) {
      modalAction();
    }
    setShowModal(false);
    setModalAction(null);
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setModalAction(null);
  };

  const mapStyleLight = [
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
  ];

  const mapStyleDark = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
    { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
    { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.iconRed} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Loading driver dashboard...</Text>
      </View>
    );
  }

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
                  customMapStyle={isDarkMode ? mapStyleDark : mapStyleLight}
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

            {/* Pending Requests */}
            <View style={styles.ridesContainer}>
              <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>New Ride Requests</Text>
              {!isOnline ? (
                <Text style={[styles.noRidesText, { color: colors.textSecondary }]}>Go online to see new requests.</Text>
              ) : pendingRequests.length === 0 ? (
                <Text style={[styles.noRidesText, { color: colors.textSecondary }]}>No new ride requests at the moment.</Text>
              ) : (
                <FlatList
                  scrollEnabled={false}
                  data={pendingRequests}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.rideCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
                      <Text style={[styles.rideCustomer, { color: colors.text }]}>
                        Request for {item.vehicle || 'Vehicle'}
                      </Text>
                      <Text style={{ color: colors.text }}>Pickup: {item.pickup}</Text>
                      <Text style={{ color: colors.text }}>Dropoff: {item.dropoff}</Text>
                      <Text style={{ color: colors.text }}>Scheduled: {new Date(item.date).toLocaleString()}</Text>
                      <Text style={{ color: colors.text }}>Status: {item.status}</Text>

                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.success }]}
                          onPress={() => acceptRide(item)}
                        >
                          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.secondaryButton }]}
                          onPress={() => declineRide(item)}
                        >
                          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>

            {/* Assigned Rides */}
            <View style={styles.ridesContainer}>
              <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>Your Assigned Rides</Text>
              {assignedRides.length === 0 ? (
                <Text style={[styles.noRidesText, { color: colors.textSecondary }]}>No rides currently assigned to you.</Text>
              ) : (
                <FlatList
                  scrollEnabled={false}
                  data={assignedRides}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={[styles.rideCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
                      <Text style={[styles.rideCustomer, { color: colors.text }]}>
                        Assigned: {item.vehicle || 'Vehicle'}
                      </Text>
                      <Text style={{ color: colors.text }}>Pickup: {item.pickup}</Text>
                      <Text style={{ color: colors.text }}>Dropoff: {item.dropoff}</Text>
                      <Text style={{ color: colors.text }}>Scheduled: {new Date(item.date).toLocaleString()}</Text>
                      <Text style={{ color: colors.text }}>Status: {item.status}</Text>

                      {item.status === 'accepted' && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.primaryButton, marginTop: 10 }]}
                          onPress={() => completeRide(item)}
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
            auth.signOut(); // <--- UPDATED: Use imported 'auth'
            navigation.navigate('Login');
          }}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Modal for alerts and confirmations */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[
              styles.modalMessage,
              { color: modalType === 'error' ? colors.errorText : colors.text }
            ]}>
              {modalMessage}
            </Text>
            {modalType === 'confirm' ? (
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.iconRed, marginRight: 10 }]}
                  onPress={handleModalConfirm}
                >
                  <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.borderColor }]}
                  onPress={handleModalCancel}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.iconRed }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const mapStyleLight = [
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
];

const mapStyleDark = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
  },
  container: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'center',
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
  },
  buttonText: {
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
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  ridesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  noRidesText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  rideCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  rideCustomer: {
    fontWeight: 'bold',
    marginBottom: 4,
  },

  statusButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },

  pendingMessage: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },

  logoutButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },

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
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 250,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
