import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { ThemeContext } from '../ThemeContext';
import { auth, database } from '../firebase';
import { ref, push, set, update } from 'firebase/database';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from 'firebase/auth';

export default function Checkout({ route, navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);
  const THEME_BUTTON_COLOR = isDarkMode ? '#FFD700' : '#333333';

  const { pickup, dropoff, date } = route.params;
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
          console.error('Firebase authentication error:', error);
          setModalMessage(`Authentication failed: ${error.message}`);
          setModalType('error');
          setShowModal(true);
          setIsAuthReady(true);
        }
      }
    });

    return () => unsubscribe();
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
      setModalMessage('Please select a vehicle type to continue.');
      setModalType('error');
      setShowModal(true);
      return;
    }

    if (!database || !userId) {
      setModalMessage('System not ready. Please try again.');
      setModalType('error');
      setShowModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const userRidesRef = ref(database, `artifacts/${appId}/users/${userId}/rides`);
      const newCustomerBookingRef = push(userRidesRef);
      const customerBookingId = newCustomerBookingRef.key;

      const vehicleDetails = vehicleOptions.find(v => v.type === selectedVehicle);
      const vehiclePrice = vehicleDetails ? vehicleDetails.price : 0;

      const bookingData = {
        pickup,
        dropoff,
        date: new Date(date).toISOString(),
        vehicle: selectedVehicle,
        bookingTime: new Date().toISOString(),
        status: 'pending',
        customerId: userId,
        customerBookingId,
        price: vehiclePrice,
      };

      await set(newCustomerBookingRef, bookingData);

      const rideRequestsRef = ref(database, `artifacts/${appId}/ride_requests`);
      const newRideRequestRef = push(rideRequestsRef);
      const requestId = newRideRequestRef.key;

      await set(newRideRequestRef, {
        ...bookingData,
        requestId,
      });

      await update(newCustomerBookingRef, { requestId });

      setModalMessage('Booking confirmed successfully!');
      setModalType('success');
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        navigation.navigate('Payment', {
          vehicle: selectedVehicle,
          price: vehiclePrice,
          pickup,
          dropoff,
          date,
        });
      }, 1500);
    } catch (error) {
      console.error('Error saving booking:', error);
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

      <Text style={[styles.heading, { color: colors.iconRed }]}>Choose a Vehicle *</Text>
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

      {!selectedVehicle && (
        <Text style={[styles.errorText, { color: THEME_BUTTON_COLOR }]}>Please select a vehicle to continue</Text>
      )}

      <TouchableOpacity
        style={[
          styles.confirmButton,
          {
            backgroundColor: selectedVehicle ? colors.iconRed : THEME_BUTTON_COLOR,
            opacity: selectedVehicle ? 1 : 0.85,
          },
        ]}
        onPress={handleConfirmBooking}
        disabled={isSaving || !isAuthReady || !selectedVehicle}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>Confirm Booking</Text>
        )}
      </TouchableOpacity>

      <Modal transparent animationType="fade" visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
            <Text
              style={[
                styles.modalMessage,
                { color: modalType === 'success' ? colors.successText : colors.errorText },
              ]}
            >
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
  confirmButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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
  errorText: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    marginBottom: 10,
  },
});