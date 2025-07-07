import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { ThemeContext } from '../ThemeContext';

// Import Firebase auth and database instances from your central firebase.js file
import { auth, database } from '../firebase'; // <--- UPDATED: Import from your firebase.js

// Firebase imports for Realtime Database functions (still needed for ref, push, set, update)
import { ref, push, set, update, onValue } from 'firebase/database'; // Added onValue for consistency if needed, though not directly used in checkout flow for listening
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth'; // Specific auth functions

export default function Checkout({ route, navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

  const { pickup, dropoff, date } = route.params;
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');

  // Firebase state
  // db and auth are now directly imported, no longer managed by useState here for initialization
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase and authenticate
  useEffect(() => {
    // No need for initializeApp or parsing firebaseConfig here, as it's done in firebase.js
    try {
      // Use the imported 'auth' instance directly
      const unsubscribe = onAuthStateChanged(auth, async (user) => { // <--- UPDATED: Use imported 'auth'
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          try {
            // Check if __initial_auth_token is provided by the environment
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(auth, __initial_auth_token); // <--- UPDATED: Use imported 'auth'
            } else {
              // Sign in anonymously if no custom token is provided (e.g., for new users)
              await signInAnonymously(auth); // <--- UPDATED: Use imported 'auth'
            }
          } catch (error) {
            console.error("Firebase authentication error:", error);
            setModalMessage(`Authentication failed: ${error.message}`);
            setModalType('error');
            setShowModal(true);
            setIsAuthReady(true);
          }
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase (from imported services):", error);
      setModalMessage(`Firebase initialization error: ${error.message}`);
      setModalType('error');
      setShowModal(true);
      setIsAuthReady(true);
    }
  }, []); // Empty dependency array means this runs once on mount

  const vehicleOptions = [
    { type: 'Mini Van', price: 150 },
    { type: 'Van', price: 200 },
    { type: 'Mini Truck', price: 250 },
    { type: 'Full Truck', price: 350 },
    { type: 'Passenger Van', price: 300 },
  ];

  const handleConfirmBooking = async () => {
    if (!selectedVehicle) {
      setModalMessage("Please select a vehicle type.");
      setModalType('error');
      setShowModal(true);
      return;
    }

    // Use the imported 'database' (db) instance directly
    if (!database || !userId) { // <--- UPDATED: Use imported 'database'
      setModalMessage("Database not ready or user not authenticated. Please try again.");
      setModalType('error');
      setShowModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

      // Use the imported 'database' instance for ref
      const userRidesRef = ref(database, `artifacts/${appId}/users/${userId}/rides`); // <--- UPDATED: Use imported 'database'
      const newCustomerBookingRef = push(userRidesRef);
      const customerBookingId = newCustomerBookingRef.key;

      const bookingDataForCustomer = {
        pickup,
        dropoff,
        date: new Date(date).toISOString(),
        vehicle: selectedVehicle,
        helpWithLoading: loadingHelp,
        bookingTime: new Date().toISOString(),
        status: 'pending',
        customerId: userId,
        customerBookingId: customerBookingId,
      };

      await set(newCustomerBookingRef, bookingDataForCustomer);

      // Use the imported 'database' instance for ref
      const rideRequestsRef = ref(database, `artifacts/${appId}/ride_requests`); // <--- UPDATED: Use imported 'database'
      const newRideRequestRef = push(rideRequestsRef);
      const requestId = newRideRequestRef.key;

      const bookingDataForDriverRequest = {
        ...bookingDataForCustomer,
        requestId: requestId,
      };

      await set(newRideRequestRef, bookingDataForDriverRequest);

      await update(newCustomerBookingRef, { requestId: requestId });

      setModalMessage("Booking confirmed successfully!");
      setModalType('success');
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        navigation.navigate('Payment', {
          vehicle: selectedVehicle,
          pickup,
          dropoff,
          date,
          helpWithLoading: loadingHelp,
        });
      }, 1500);
    } catch (error) {
      console.error("Error saving booking:", error);
      setModalMessage(`Failed to confirm booking: ${error.message}`);
      setModalType('error');
      setShowModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>

      <Text style={[styles.title, { color: colors.iconRed }]}>Confirm Your Trip</Text>

      <View style={[styles.summaryBox, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
        <Text style={[styles.label, { color: colors.text }]}>Pickup:</Text>
        <Text style={[styles.value, { color: colors.textSecondary }]}>{pickup}</Text>

        <Text style={[styles.label, { color: colors.text }]}>Dropoff:</Text>
        <Text style={[styles.value, { color: colors.textSecondary }]}>{dropoff}</Text>

        <Text style={[styles.label, { color: colors.text }]}>Scheduled Time:</Text>
        <Text style={[styles.value, { color: colors.textSecondary }]}>{new Date(date).toLocaleString()}</Text>
      </View>

      <Text style={[styles.heading, { color: colors.iconRed }]}>Choose a Vehicle</Text>
      {vehicleOptions.map((v, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.vehicleCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.borderColor,
            },
            selectedVehicle === v.type && {
              borderColor: colors.iconRed,
              backgroundColor: isDarkMode ? colors.darkHighlight : colors.lightHighlight,
            },
          ]}
          onPress={() => setSelectedVehicle(v.type)}
        >
          <Text style={[styles.vehicleText, { color: colors.text }]}>{v.type}</Text>
          <Text style={[styles.price, { color: colors.iconRed }]}>R{v.price}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: colors.text }]}>Need help loading/unloading?</Text>
        <Switch
          value={loadingHelp}
          onValueChange={setLoadingHelp}
          trackColor={{ false: colors.borderColor, true: colors.iconRed }}
          thumbColor={isDarkMode ? colors.cardBackground : colors.buttonText}
        />
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: colors.iconRed }]}
        onPress={handleConfirmBooking}
        disabled={isSaving || !isAuthReady}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>Confirm Booking</Text>
        )}
      </TouchableOpacity>

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
              { color: modalType === 'success' ? colors.successText : colors.errorText }
            ]}>
              {modalMessage}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.iconRed }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.buttonText }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'center',
  },
  summaryBox: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
  },
  value: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  vehicleCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  switchLabel: {
    fontSize: 16,
  },
  confirmButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
