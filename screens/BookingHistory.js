import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { auth, database } from '../firebase';
import { ref, onValue, remove } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function BookingHistory({ navigation }) {
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const vehicleTypes = ['All', 'Mini Van', 'Van', 'Mini Truck', 'Full Truck'];

  const fetchRides = () => {
    const user = auth.currentUser;
    if (!user) return;

    const ridesRef = ref(database, `rides/${user.uid}`);
    onValue(ridesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allRides = Object.entries(data).reverse(); // preserve keys
        setRides(allRides);
        setFilteredRides(allRides);
      } else {
        setRides([]);
        setFilteredRides([]);
      }
      setLoading(false);
    });
  };

  useEffect(fetchRides, []);

  useEffect(() => {
    let updated = [...rides];

    if (searchQuery) {
      updated = updated.filter(([key, ride]) =>
        ride.pickup?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.dropoff?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedVehicle && selectedVehicle !== 'All') {
      updated = updated.filter(([key, ride]) => ride.vehicle === selectedVehicle);
    }

    setFilteredRides(updated);
  }, [searchQuery, selectedVehicle, rides]);

  const rebookRide = (ride) => {
    navigation.navigate('Checkout', {
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      date: new Date().toISOString(),
    });
  };

  const deleteRide = (rideKey) => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert('Delete Ride', 'Are you sure you want to delete this ride?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          remove(ref(database, `rides/${user.uid}/${rideKey}`));
        },
        style: 'destructive',
      },
    ]);
  };

  const clearAllHistory = () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert('Clear All History', 'This will remove all your ride history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        onPress: () => {
          remove(ref(database, `rides/${user.uid}`));
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Booking History</Text>
      <Text style={styles.subtitle}>Track, manage and rebook your past deliveries</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search pickup or drop-off"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {vehicleTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              selectedVehicle === type && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedVehicle(type)}
          >
            <Text
              style={[
                styles.filterText,
                selectedVehicle === type && styles.filterTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredRides.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearAllHistory}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#b80000" style={{ marginTop: 40 }} />
      ) : filteredRides.length === 0 ? (
        <Text style={styles.noRides}>No rides found for current filter.</Text>
      ) : (
        filteredRides.map(([key, ride], index) => (
          <View key={key} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={24} color="#b80000" />
              <Text style={styles.cardTitle}>
                {ride.vehicle || 'Ride'} #{index + 1}
              </Text>
              <TouchableOpacity onPress={() => deleteRide(key)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#b80000" />
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.label}>Pickup:</Text>
              <Text style={styles.value}>{ride.pickup}</Text>

              <Text style={styles.label}>Drop-off:</Text>
              <Text style={styles.value}>{ride.dropoff}</Text>

              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>
                {ride.date ? new Date(ride.date).toLocaleString() : 'N/A'}
              </Text>

              {ride.vehicle && (
                <>
                  <Text style={styles.label}>Vehicle:</Text>
                  <Text style={styles.value}>{ride.vehicle}</Text>
                </>
              )}

              {ride.driverName && ride.driverPhone && (
                <>
                  <Text style={styles.label}>Assigned Driver:</Text>
                  <View style={styles.driverBox}>
                    <Text style={styles.driverName}>{ride.driverName}</Text>
                    <Text style={styles.driverPhone}>{ride.driverPhone}</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.rebookButton} onPress={() => rebookRide(ride)}>
              <Ionicons name="repeat-outline" size={18} color="#fff" />
              <Text style={styles.rebookText}>Rebook</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f0f0f0', padding: 20, flex: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#b80000', textAlign: 'center', marginTop: 30 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderColor: '#c5a34f',
    borderWidth: 1,
  },
  filterRow: { flexDirection: 'row', marginBottom: 15 },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#c5a34f',
  },
  filterButtonActive: { backgroundColor: '#b80000', borderColor: '#b80000' },
  filterText: { color: '#333', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  noRides: { fontSize: 16, color: '#777', textAlign: 'center', marginTop: 50 },
  clearButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    backgroundColor: '#b80000',
    borderRadius: 6,
    marginBottom: 10,
  },
  clearText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#b80000', flex: 1 },
  deleteBtn: { padding: 6 },
  cardContent: { marginTop: 6 },
  label: { fontSize: 14, color: '#666', marginTop: 8 },
  value: { fontSize: 15, color: '#333', fontWeight: '500' },
  rebookButton: {
    backgroundColor: '#b80000',
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rebookText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // New styles for driver info
  driverBox: {
    backgroundColor: '#fff9ec',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#c5a34f',
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#b80000',
  },
  driverPhone: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
});
