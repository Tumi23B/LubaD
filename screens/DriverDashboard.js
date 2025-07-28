import React, { useState, useEffect, useContext, useRef } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { auth, database } from '../firebase';
import { ref, get, update, onValue, remove, increment } from 'firebase/database';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { ThemeContext } from '../ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MailComposer from 'expo-mail-composer';
import * as FileSystem from 'expo-file-system';
import { logout } from '../utils/logout';
import { generatePDFReport } from '../utils/pdfHelper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Constants } from 'expo-constants';
import fetchUserDetails from '../utils/firebaseHelpers';
import { LogBox, Platform } from 'react-native';

// Ignore specific warning messages
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

LogBox.ignoreLogs([
  'Firebase authentication error: FirebaseError: Firebase: Error (auth/admin-restricted-operation).',
]);

{/*Or ignore all logs (not recommended unless you're demoing)
LogBox.ignoreAllLogs(true);*/}




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
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [modalAction, setModalAction] = useState(null);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [pastShifts, setPastShifts] = useState([]);
  // New state to manage visibility of new ride requests
  const [hasAcceptedRide, setHasAcceptedRide] = useState(false); 
  
  

  const route = useRoute();
  const driverEmail = route.params?.email || '';
  const nameDriver = route.params?.username || 'Driver';
  const hasResetThisWeek = useRef(false);

  // Initializing Firebase authentication
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
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
  }, []);

  // Fetch driver data and initial location
  useEffect(() => {
    if (!isAuthReady || !database || !userId) return;

    const fetchDriverProfile = async () => {
      try {
        const driverAppSnap = await get(ref(database, `driverApplications/${userId}`));
        if (driverAppSnap.exists()) {
          const data = driverAppSnap.val();
          setDriverName(data.fullName || 'Driver');
          setIsApproved(data.status === 'Approved');
        }
      } catch (error) {
        console.warn('Error fetching driver data:', error);
      }
    };

    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setModalMessage('Location permission is required to use the driver dashboard.');
          setModalType('error');
          setShowModal(true);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setDriverLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.warn('Error fetching location:', error);
      }
    };

    const restoreShiftId = async () => {
      try {
        const savedShiftId = await AsyncStorage.getItem('currentShiftId');
        if (savedShiftId) {
          setCurrentShiftId(savedShiftId);
        }
      } catch (error) {
        console.warn('Failed to restore shift ID:', error);
      }
    };

    fetchDriverProfile();
    getLocation();
    restoreShiftId();
    setLoading(false);
  }, [isAuthReady, database, userId]);

  // Listen for changes in driver's online status
  useEffect(() => {
    if (!isAuthReady || !database || !userId) return;

    const statusRef = ref(database, `driverStatus/${userId}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.isOnline !== undefined) {
        setIsOnline(data.isOnline);
      }
    });
    return () => unsubscribe();
  }, [isAuthReady, database, userId]);

  // Listen for pending ride requests and calculate earnings
  useEffect(() => {
    if (!isAuthReady || !database || !userId || !isApproved) {
      setPendingRequests([]);
      setAssignedRides([]);
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const allRideRequestsRef = ref(database, `artifacts/${appId}/ride_requests`);

    const unsubscribe = onValue(allRideRequestsRef, (snapshot) => {
      const data = snapshot.val();
      const pendingList = [];
      const assignedList = [];

      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          // Only add to pending if driver is online and no ride has been accepted yet
          if (value.status === 'pending' && isOnline && !hasAcceptedRide) {
            pendingList.push({ id: key, ...value });
          }

          if (value.driverId === userId) {
            if (value.status !== 'completed' && value.status !== 'declined') {
              assignedList.push({ id: key, ...value });
              // If there's an assigned ride, set hasAcceptedRide to true
              if (value.status === 'accepted') {
                setHasAcceptedRide(true);
              }
            }
          }
        });
      }
      setPendingRequests(pendingList.reverse());
      setAssignedRides(assignedList.reverse());
    }, (error) => {
      console.error("Error fetching ride requests:", error);
      setModalMessage(`Failed to load data: ${error.message}`);
      setModalType('error');
      setShowModal(true);
    });

    // Clean up the listener when the component unmounts or dependencies change
    return () => unsubscribe();
  }, [isAuthReady, database, userId, isApproved, isOnline, hasAcceptedRide]); // Add hasAcceptedRide to dependencies

  // Fetch past shifts history
  useEffect(() => {
    if (!isAuthReady || !database || !userId) return;

    const shiftsRef = ref(database, `driverShifts/${userId}`);
    const unsubscribe = onValue(shiftsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPastShifts([]);
        return;
      }

      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const filteredShifts = Object.entries(data)
        .map(([id, shift]) => ({ id, ...shift }))
        .filter((shift) => {
          const start = Number(shift.startTime);
          return !isNaN(start) && start >= sevenDaysAgo;
        })
        .sort((a, b) => b.startTime - a.startTime);

      setPastShifts(filteredShifts);
    });

    return () => unsubscribe();
  }, [isAuthReady, database, userId]);

  // Weekly reset logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const isSunday = now.getDay() === 0;
      const isTimeToReset = now.getHours() === 23 && now.getMinutes() === 59;

      if (isSunday && isTimeToReset && !hasResetThisWeek.current) {
        if (pastShifts.length > 0) {
          generatePDFReport(pastShifts, driverEmail, nameDriver)
            .then(() => {
              setPastShifts([]);
              hasResetThisWeek.current = true;
            })
            .catch((err) => {
              console.error('Error generating PDF!', err);
            });
        } else {
          setPastShifts([]);
          hasResetThisWeek.current = true;
        }
      }

      if (now.getDay() === 1 && hasResetThisWeek.current) {
        hasResetThisWeek.current = false;
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [pastShifts]);

  // Location updates for the driver
  useEffect(() => {
    if (!isAuthReady || !database || !userId || !isOnline) return;

    let locationInterval;

    const startLocationUpdates = () => {
      locationInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          const driverStatusRef = ref(database, `driverStatus/${userId}`);
          await update(driverStatusRef, {
            location: coords,
            timestamp: Date.now(),
          });
          setDriverLocation(coords);
        } catch (error) {
          console.warn('Error updating location!', error);
        }
      }, 10000);
    };

    startLocationUpdates();

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [isOnline, isAuthReady, database, userId]);

  const toggleOnlineStatus = async () => {
    if (!userId || !database) return;

    const newStatus = !isOnline;
    setIsOnline(newStatus);

    try {
      const driverStatusRef = ref(database, `driverStatus/${userId}`);
      await update(driverStatusRef, {
        isOnline: newStatus,
        timestamp: Date.now(),
        location: driverLocation || null,
      });

      if (newStatus) {
        const shiftId = Date.now().toString();
        setCurrentShiftId(shiftId);
        await AsyncStorage.setItem('currentShiftId', shiftId);

        const shiftRef = ref(database, `driverShifts/${userId}/${shiftId}`);
        await update(shiftRef, {
          startTime: Date.now(),
          totalEarnings: 0,
          completedRides: 0,
        });
        // When driver starts driving, ensure new requests are visible
        setHasAcceptedRide(false); 
      } else {
        const savedShiftId = await AsyncStorage.getItem('currentShiftId');
        if (savedShiftId) {
          const shiftRef = ref(database, `driverShifts/${userId}/${savedShiftId}`);
          await update(shiftRef, {
            endTime: Date.now(),
          });
          await AsyncStorage.removeItem('currentShiftId');
          await AsyncStorage.removeItem('sessionEarnings');
          setCurrentShiftId(null);
        }

        setPendingRequests([]);
        setAssignedRides([]);
        setTotalEarnings(0);
        setHasAcceptedRide(false); // Reset when going offline
      }
    } catch (error) {
      console.warn('Failed to update driver status:', error);
      setIsOnline(!newStatus);
      setModalMessage(`Failed to change online status: ${error.message}`);
      setModalType('error');
      setShowModal(true);
    }
  };

  // Reusable helper to get customer profile info by ID
  const fetchUserDetails = async (database, userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);

    console.log('Fetched snapshot for user:', snapshot.val());

    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        username: data.username || 'Unknown',
        phoneNumber: data.phoneNumber || 'N/A',
      };
    } else {
      console.warn('No user data found for:', userId);
      return { username: 'Unknown', phoneNumber: 'N/A' };
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return { username: 'Unknown', phoneNumber: 'N/A' };
  }
};

const declineRide = async (ride) => {
  if (!userId || !database) return;

  setModalMessage(`Decline ride from ${ride.pickup} to ${ride.dropoff}?`);
  setModalType('confirm');
  setModalAction(() => async () => {
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const rideRef = ref(database, `artifacts/${appId}/ride_requests/${ride.id}`);

      // Option 1: Mark the ride as declined
      await update(rideRef, {
        status: 'declined',
        declinedBy: userId,
        declinedAt: new Date().toISOString(),
      });

      // Optionally update the user's private booking
      if (ride.customerId && ride.customerBookingId) {
        const customerBookingRef = ref(
          database,
          `artifacts/${appId}/users/${ride.customerId}/rides/${ride.customerBookingId}`
        );

        await update(customerBookingRef, {
          status: 'declined',
          declinedBy: userId,
          declinedAt: new Date().toISOString(),
        });
      }

      // Remove from  dashboard
      setPendingRequests((prev) => prev.filter((r) => r.id !== ride.id));

      setModalMessage('Ride has been declined and removed.');
      setModalType('success');
      setModalAction(null);
      setShowModal(true);
    } catch (error) {
      console.error('Error declining ride:', error);
      setModalMessage(`Failed to decline ride: ${error.message}`);
      setModalType('error');
      setModalAction(null);
      setShowModal(true);
    }
  });

  setShowModal(true);
};


// Updated acceptRide function with deep linking by address strings
const acceptRide = (request) => {
  if (!userId || !database || !driverName) {

    setModalMessage("Driver data not ready. Cannot accept ride.");
    setModalType('error');
    setShowModal(true);
    return;
  }

  // Ask driver for confirmation to accept
  setModalMessage(`Accept ride from ${request.pickup} to ${request.dropoff}?`);
  setModalType('confirm');
  setModalAction(() => async () => {
    console.log("OK tapped, now processing ride acceptance...")

    /*if (driverSnap.exists()) {
      const driverData = driverSnap.val();
      driverFullName = driverData.fullName || driverName;
      driverPhone = driverData.phoneNumber || 'N/A';
      driverImage = driverData.profileImage || null;
    }*/

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

      // Fetch driver's full profile
      const profileSnap = await get(ref(database, `drivers/${userId}`));
      const profile = profileSnap.exists() ? profileSnap.val() : {};

      // Update ride request with driver details
    const publicRequestRef = ref(database, `artifacts/${appId}/ride_requests/${request.id}`);
    await update(publicRequestRef, {
      status: 'accepted',
      driverId: userId,
      driverName: profile.fullName || driverName,
      driverPhone: profile.phoneNumber || 'N/A',
      driverImage: profile.profileImage || null,
      acceptedAt: new Date().toISOString(),
    });

      // Update customer booking with same profile info
    if (request.customerId && request.customerBookingId) {
      const customerBookingRef = ref(database, `artifacts/${appId}/users/${request.customerId}/rides/${request.customerBookingId}`);
      await update(customerBookingRef, {
        status: 'accepted',
        driverId: userId,
        driverName: profile.fullName || driverName,
        driverPhone: profile.phoneNumber || 'N/A',
        driverImage: profile.profileImage || null,
        acceptedAt: new Date().toISOString(),
      });
    }

      //  Updated customer's booking
      if (request.customerId && request.customerBookingId) {
        const customerBookingRef = ref(database, `artifacts/${appId}/users/${request.customerId}/rides/${request.customerBookingId}`);
        await update(customerBookingRef, {
          status: 'accepted',
          driverId: userId,
          driverName: driverName,
          acceptedAt: new Date().toISOString(),
        });
      }

      const { username, phoneNumber, imageUrl} = await fetchUserDetails(database, request.customerId);
      console.log("Fetched user details:", username, phoneNumber, imageUrl);

      //  Update driver's profile with trip count
      await update(publicRequestRef, {
        status: 'accepted',
        driverId: userId,
        driverName: profile.fullName || driverName,
        driverPhone: profile.phoneNumber || 'N/A',
        driverImage: profile.profileImage || null,
        acceptedAt: new Date().toISOString(),
      });

      // Set hasAcceptedRide to true to hide other pending requests
      setHasAcceptedRide(true);


      //  Setting modal to open Google Maps
      setModalMessage("Ride accepted successfully! Use Google Maps to Navigate to Customer's Location .");
      setModalType('success');
      setModalAction(() => async () => {
        const pickup = request.pickup?.trim();
        const dropoff = request.dropoff?.trim();

        console.log("Pickup:", pickup);
        console.log("Dropoff:", dropoff);

        if (!pickup || !dropoff) {
          Alert.alert('Missing Address', 'Pickup or dropoff address is missing or invalid.');
          return;
        }

        const origin = encodeURIComponent(pickup);
        const destination = encodeURIComponent(dropoff);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

        const supported = await Linking.canOpenURL(mapsUrl);
        if (supported) {
          Linking.openURL(mapsUrl);
        } else {
          Alert.alert('Error', 'Unable to open Google Maps!.');
        }
      });

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


// Updated navigateToPickup function to use address string and deep linking
const navigateToPickup = (pickupAddress) => {
  if (!pickupAddress) {
    Alert.alert('Missing Address', 'Pickup address is missing.');
    return;
  }

  const destination = encodeURIComponent(pickupAddress);
  const mapsUrl = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;

  Linking.canOpenURL(mapsUrl).then((supported) => {
    if (supported) {
      Linking.openURL(mapsUrl);
    } else {
      // fallback to browser maps
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Error', 'Could not open Google Maps.');
      });
    }
  });
};

  const completeRide = async (ride) => {
  if (!userId || !database) return;

  setModalMessage(`Mark ride from ${ride.pickup} to ${ride.dropoff} as complete?`);
  setModalType('confirm');
  setModalAction(() => async () => {
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

      // Update public ride request
      const publicRequestRef = ref(database, `artifacts/${appId}/ride_requests/${ride.id}`);
      await update(publicRequestRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Update customer’s private booking
      if (ride.customerId && ride.customerBookingId) {
        const customerBookingRef = ref(
          database,
          `artifacts/${appId}/users/${ride.customerId}/rides/${ride.customerBookingId}`
        );

        await update(customerBookingRef, {
          status: 'completed',
          driverId: userId,
          driverName: driverName,
          completedAt: new Date().toISOString(),
          pickupCoords: ride.pickupCoords || null,
          dropoffCoords: ride.dropoffCoords || null,
        });
      }

      // Update driver's shift stats
      const ridePrice = ride.price || 0;
      setTotalEarnings((prev) => {
        const updated = prev + ridePrice;
        AsyncStorage.setItem('sessionEarnings', JSON.stringify(updated));
        return updated;
      });

      if (currentShiftId) {
        const shiftRef = ref(database, `driverShifts/${userId}/${currentShiftId}`);
        await update(shiftRef, {
          totalEarnings: increment(ridePrice),
          completedRides: increment(1),
        });
      }

      // Update driver profile trip count
      const driverProfileRef = ref(database, `drivers/${userId}`);
      await update(driverProfileRef, {
        tripsCompleted: increment(1),
      });

      // Set hasAcceptedRide to false to show other pending requests again
      setHasAcceptedRide(false);

      setModalMessage("Ride completed successfully! Trip count updated.");
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


  const endShift = () => {
    setModalAction(() => async () => {
      setTotalEarnings(0);
      await AsyncStorage.removeItem('sessionEarnings');
      setIsOnline(false);
      toggleOnlineStatus();
      setModalMessage("Shift ended. Your earnings have been reset.");
      setModalType('info');
      setShowModal(true);
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

  const weeklyRideCount = pastShifts.reduce(
    (sum, shift) => sum + (shift.completedRides || 0),
    0
  );

  
  const weeklyEarnings = pastShifts.reduce(
    (sum, shift) => sum + (shift.totalEarnings || 0),
    0
  );

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
        <Text style={[styles.title, { color: colors.iconRed }]}>Welcome, {driverName} 🧑‍✈️</Text>

        <View style={styles.statusContainer}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Approval Status:</Text>
          <Text style={[styles.statusText, isApproved ? styles.approved : styles.pending]}>
            {isApproved ? 'Approved' : 'Pending Approval'}
          </Text>
        </View>

        {isApproved ? (
          <>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: colors.iconRed }]}
                onPress={() => navigation.navigate('DriverProfile')}
              >
                <Text style={[styles.buttonText, { color: colors.buttonText }]}>My Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ridesContainer}>
              <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>📅 Past Shifts</Text>
              {pastShifts.length === 0 ? (
                <Text style={[styles.noRidesText, { color: colors.textSecondary }]}>
                  No recorded shifts yet.
                </Text>
              ) : (
                <>
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    This Week: {weeklyRideCount} Ride{weeklyRideCount !== 1 ? 's' : ''} | R{weeklyEarnings.toFixed(2)} Earned
                  </Text>
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: colors.iconRed, marginTop: 8 }]}
                    onPress={() => generatePDFReport(pastShifts, driverEmail, nameDriver)}
                  >
                    <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                      View Full Report
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {driverLocation && (
  <View style={{ marginBottom: 20 }}>
    <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>Your Location</Text>
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.borderColor,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.cardBackground,
        elevation: Platform.OS === 'android' ? 3 : 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }}
    >
      <MapView
        style={{ width: '100%', height: 200 }} // Make sure it has visible dimensions
        region={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        customMapStyle={isDarkMode ? mapStyleDark : mapStyleLight}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker
          coordinate={driverLocation}
          pinColor={colors.iconRed}
          title="You are here"
        />
      </MapView>
    </View>
  </View>
)}

    
            <View style={[styles.earningsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
              <Text style={[styles.earningsTitle, { color: colors.text }]}>Earning Summary</Text>
              <Text style={[styles.earningsAmount, { color: colors.iconRed }]}>R {totalEarnings.toFixed(2)}</Text>
            </View>

            {/* Conditional rendering for New Ride Requests */}
            {!hasAcceptedRide && (
              <View style={styles.ridesContainer}>
                <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>New Delivery Requests</Text>
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
                            style={[styles.actionButton, { backgroundColor: colors.iconRed }]}
                            onPress={() => acceptRide(item)}
                          >
                            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Accept</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.iconRed }]}
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
            )}

            <View style={styles.ridesContainer}>
              <Text style={[styles.sectionTitle, { color: colors.iconRed }]}>Your Assigned Requests</Text>
              {assignedRides.length === 0 ? (
                <Text style={[styles.noRidesText, { color: colors.textSecondary }]}>No rides currently assigned to you.</Text>
              ) :
               (
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

                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.iconRed, marginTop: 10 }]}
                        onPress={async () => {
                          try {
                            if (!item.customerId) {
                              Alert.alert('Missing Info', 'Customer ID not found for this ride.');
                              return;
                            }

                            const { username, phoneNumber } = await fetchUserDetails(database, item.customerId);

                            if (!username || !phoneNumber) {
                              Alert.alert('Missing Info', 'Could not fetch customer info.');
                              return;
                            }

                            navigation.navigate('DriverChat', {
                              customerName: username,
                              customerPhone: phoneNumber,
                            });
                          } catch (error) {
                            console.error('Error fetching customer info:', error);
                            Alert.alert('Error', 'Failed to fetch customer details.');
                          }
                        }}

                      >
                       <Text style={[styles.buttonText, { color: colors.buttonText }]}>Contact & Share Location</Text>
                      </TouchableOpacity>

                        {item.status === 'accepted' && (
                          <>
                            {item.pickup && (
                              <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#4285F4', marginTop: 30 }]}
                                onPress={() => navigateToPickup(item.pickup)}
                              >
                                <Text style={[styles.buttonText, { color: 'white' }]}>Navigate to Pickup</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={[styles.actionButton, { backgroundColor: colors.iconRed, marginTop: 10 }]}
                              onPress={() => completeRide(item)}
                            >
                              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Mark as Complete</Text>
                            </TouchableOpacity>
                          </>
                        )}

                    </View>
                  )}
                />
              )}
            </View>

            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: isOnline ? colors.warning : colors.iconRed }]}
              onPress={toggleOnlineStatus}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {isOnline ? 'Go Offline' : 'Start Driving'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.endShiftButton, { backgroundColor: colors.iconRed }]}
              onPress={endShift}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>End Shift</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={[styles.pendingMessage, { color: colors.warning }]}>
            Your driver application is being reviewed. Please wait for approval.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.iconRed }]}
          onPress={() => logout(navigation, 'driver')}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Logout</Text>
        </TouchableOpacity>
      </View>

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
    flexGrow: 1,
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
  endShiftButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
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
  summaryText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
});
