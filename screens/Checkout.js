import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { ThemeContext } from '../ThemeContext';

// Firebase imports for Realtime Database
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, push, set } from 'firebase/database'; // Import Realtime Database functions

export default function Checkout({ route, navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

  const { pickup, dropoff, date } = route.params;
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'

  // Firebase state
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase and authenticate
  useEffect(() => {
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

      if (Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase config is empty. Please ensure __firebase_config is correctly provided.");
        setModalMessage("Firebase configuration error. Cannot save booking.");
        setModalType('error');
        setShowModal(true);
        return;
      }

      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getDatabase(app); // Get Realtime Database instance

      setAuth(authInstance);
      setDb(dbInstance);

      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          // If no user, try to sign in anonymously
          try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(authInstance, __initial_auth_token);
            } else {
              await signInAnonymously(authInstance);
            }
          } catch (error) {
            console.error("Firebase authentication error:", error);
            setModalMessage(`Authentication failed: ${error.message}`);
            setModalType('error');
            setShowModal(true);
            setIsAuthReady(true); // Still set to true to unblock UI, but with error
          }
        }
      });

      return () => unsubscribe(); // Cleanup auth listener
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setModalMessage(`Firebase init error: ${error.message}`);
      setModalType('error');
      setShowModal(true);
      setIsAuthReady(true);
    }
  }, []);

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

    if (!db || !userId) {
      setModalMessage("Database not ready. Please try again.");
      setModalType('error');
      setShowModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const bookingData = {
        pickup,
        dropoff,
        date: new Date(date).toISOString(), // Store as ISO string for consistency
        vehicle: selectedVehicle,
        helpWithLoading: loadingHelp,
        bookingTime: new Date().toISOString(), // Timestamp of when the booking was made
      };

      // Define the path for user-specific private data in Realtime Database
      // Realtime Database structure: /artifacts/{appId}/users/{userId}/rides
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const userRidesRef = ref(db, `artifacts/${appId}/users/${userId}/rides`);

      // Push new data to the Realtime Database
      await push(userRidesRef, bookingData);

      setModalMessage("Booking confirmed successfully!");
      setModalType('success');
      setShowModal(true);

      // Navigate to Payment or Booking History after a short delay
      setTimeout(() => {
        setShowModal(false);
        navigation.navigate('Payment', {
          vehicle: selectedVehicle,
          pickup,
          dropoff,
          date,
          helpWithLoading: loadingHelp,
          // You might want to pass the booking ID if Payment needs it
        });
      }, 1500); // Show success message for 1.5 seconds
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
        disabled={isSaving || !isAuthReady} // Disable button while saving or if auth not ready
      >
        {isSaving ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>Confirm Booking</Text>
        )}
      </TouchableOpacity>

      {/* Custom Modal for messages */}
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
