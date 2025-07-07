import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { auth, database } from '../firebase';

import { ref, onValue, remove, get } from 'firebase/database'; // Ensure 'get' is imported
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../ThemeContext';

export default function BookingHistory({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [modalAction, setModalAction] = useState(null);

  // Initialize Firebase (authentication part)
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await auth.signInWithCustomToken(__initial_auth_token);
          } else {
            await auth.signInAnonymously();
          }
        } catch (error) {
          console.error("Firebase authentication error in BookingHistory:", error);
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

  // Fetch rides once auth and database are ready
  useEffect(() => {
    console.log("BookingHistory: database instance:", database);

    if (!isAuthReady || !database || !userId) {
      console.log("BookingHistory: Not ready to fetch rides. isAuthReady:", isAuthReady, "database:", !!database, "userId:", !!userId);
      setLoading(true);
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const ridesRef = ref(database, `artifacts/${appId}/users/${userId}/rides`);

    const unsubscribeOnValue = onValue(ridesRef, (snapshot) => {
      const data = snapshot.val();
      const allRides = [];
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (value.status !== 'driver_declined') {
            allRides.push({ id: key, ...value });
          }
        });
      }
      setRides(allRides.reverse());
      setFilteredRides(allRides.reverse());
      setLoading(false);
    }, (error) => {
      console.error("Error fetching rides in BookingHistory:", error);
      setModalMessage(`Failed to load rides: ${error.message}`);
      setModalType('error');
      setShowModal(true);
      setLoading(false);
    });

    return () => unsubscribeOnValue();
  }, [isAuthReady, userId]);

  useEffect(() => {
    let updated = [...rides];

    if (searchQuery) {
      updated = updated.filter((ride) => // Changed from [key, ride] to ride directly
        ride.pickup?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.dropoff?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedVehicle && selectedVehicle !== 'All') {
      updated = updated.filter((ride) => ride.vehicle === selectedVehicle); // Changed from [key, ride] to ride directly
    }

    setFilteredRides(updated);
  }, [searchQuery, selectedVehicle, rides]);

  const vehicleTypes = ['All', 'Mini Van', 'Van', 'Mini Truck', 'Full Truck', 'Passenger Van'];

  const rebookRide = (ride) => {
    navigation.navigate('Checkout', {
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      date: new Date().toISOString(),
    });
  };

  const deleteRide = (rideKey) => {
    if (!auth.currentUser || !database) {
      setModalMessage("Authentication or database not ready. Cannot delete ride.");
      setModalType('error');
      setShowModal(true);
      return;
    }

    setModalMessage('Are you sure you want to delete this ride from your history?');
    setModalType('confirm');
    setModalAction(() => async () => {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const userId = auth.currentUser.uid; // Ensure userId is available

        // 1. Remove from user's personal history
        await remove(ref(database, `artifacts/${appId}/users/${userId}/rides/${rideKey}`));

        // 2. Check and remove from public ride_requests if it's still pending or driver_declined
        // Use a try-catch around the get operation to isolate potential errors
        try {
            const publicRequestRef = ref(database, `artifacts/${appId}/ride_requests/${rideKey}`);
            const rideSnapshot = await get(publicRequestRef); // This is where the 'get' is used
            if (rideSnapshot.exists()) {
                const rideData = rideSnapshot.val();
                // Only remove from public queue if it's still pending or was declined by a driver
                if (rideData.status === 'pending' || rideData.status === 'driver_declined') {
                    await remove(publicRequestRef);
                }
            }
        } catch (get_error) {
            console.warn("Could not check/remove from public requests (might not exist or already processed):", get_error);
            // Log the error but don't block the main deletion, as the primary goal is to remove from user's history
        }

        setModalMessage('Ride deleted successfully!');
        setModalType('success');
      } catch (error) {
        console.error("Error deleting ride:", error);
        setModalMessage(`Failed to delete ride: ${error.message}`);
        setModalType('error');
      } finally {
        setShowModal(true);
      }
    });
    setShowModal(true);
  };

  const clearAllHistory = () => {
    if (!auth.currentUser || !database) {
      setModalMessage("Authentication or database not ready. Cannot clear history.");
      setModalType('error');
      setShowModal(true);
      return;
    }

    setModalMessage('This will remove all your ride history. Are you sure?');
    setModalType('confirm');
    setModalAction(() => async () => {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const userId = auth.currentUser.uid; // Ensure userId is available

        await remove(ref(database, `artifacts/${appId}/users/${userId}/rides`));

        setModalMessage('All history cleared successfully!');
        setModalType('success');
      } catch (error) {
        console.error("Error clearing all history:", error);
        setModalMessage(`Failed to clear history: ${error.message}`);
        setModalType('error');
      } finally {
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.iconRed} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Loading booking history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.iconRed }]}>Booking History</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track, manage and rebook your past deliveries</Text>

      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.cardBackground,
            color: colors.text,
            borderColor: colors.borderColor,
          },
        ]}
        placeholder="🔍 Search pickup or drop-off"
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {vehicleTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedVehicle === type ? colors.iconRed : colors.cardBackground,
                borderColor: selectedVehicle === type ? colors.iconRed : colors.borderColor,
              },
            ]}
            onPress={() => setSelectedVehicle(type)}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedVehicle === type ? colors.buttonText : colors.text },
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredRides.length > 0 && (
        <TouchableOpacity style={[styles.clearButton, { backgroundColor: colors.iconRed }]} onPress={clearAllHistory}>
          <Ionicons name="trash-outline" size={18} color={colors.buttonText} />
          <Text style={[styles.clearText, { color: colors.buttonText }]}>Clear All</Text>
        </TouchableOpacity>
      )}

      {filteredRides.length === 0 ? (
        <Text style={[styles.noRides, { color: colors.textSecondary }]}>No rides found for current filter.</Text>
      ) : (
        filteredRides.map((ride) => (
          <View key={ride.id} style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={24} color={colors.iconRed} />
              <Text style={[styles.cardTitle, { color: colors.iconRed }]}>
                {ride.vehicle || 'Ride'}
              </Text>
              <TouchableOpacity onPress={() => deleteRide(ride.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.iconRed} />
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Pickup:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{ride.pickup}</Text>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Drop-off:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{ride.dropoff}</Text>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Date:</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {ride.date ? new Date(ride.date).toLocaleString() : 'N/A'}
              </Text>

              {ride.vehicle && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Vehicle:</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{ride.vehicle}</Text>
                </>
              )}

              {ride.status && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Status:</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{ride.status}</Text>
                </>
              )}

              {ride.driverName && ride.driverPhone && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Assigned Driver:</Text>
                  <View style={[styles.driverBox, { backgroundColor: colors.background, borderColor: colors.borderColor }]}>
                    <Text style={[styles.driverName, { color: colors.iconRed }]}>{ride.driverName}</Text>
                    <Text style={[styles.driverPhone, { color: colors.textSecondary }]}>{ride.driverPhone || 'N/A'}</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity style={[styles.rebookButton, { backgroundColor: colors.iconRed }]} onPress={() => rebookRide(ride)}>
              <Ionicons name="repeat-outline" size={18} color={colors.buttonText} />
              <Text style={[styles.rebookText, { color: colors.buttonText }]}>Rebook</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

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

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  searchInput: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 10,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '500',
  },
  noRides: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  clearButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  clearText: {
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  cardContent: {
    marginTop: 6,
  },
  label: {
    fontSize: 14,
    marginTop: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
  },
  rebookButton: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rebookText: {
    fontWeight: '600',
    fontSize: 14,
  },
  driverBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
  },
  driverPhone: {
    fontSize: 13,
    marginTop: 2,
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
