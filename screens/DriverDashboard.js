import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

export default function DriverDashboard({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [driverName, setDriverName] = useState('John Doe'); // Replace with real user data
  const [isApproved, setIsApproved] = useState(true); // Set true or false based on admin approval

  // Example rides data (empty for now)
  const [rides, setRides] = useState([
    // Sample ride structure:
    // { id: '1', customer: 'Alice', pickup: 'Location A', dropoff: 'Location B', status: 'Pending' },
  ]);

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

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
            {/* Replace with real earnings from backend */}
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
          // Your logout logic here
          // For example: auth.signOut() and navigation.navigate('Login')
          alert('Logout pressed');
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
  earningsContainer: { marginBottom: 20, padding: 15, backgroundColor: '#f5f5f5', borderRadius: 8 },
  earningsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  earningsAmount: { fontSize: 24, fontWeight: 'bold', color: '#D90D32' },
  ridesContainer: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
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
  onlineButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  online: { backgroundColor: '#28a745' },
  offline: { backgroundColor: '#dc3545' },
  onlineButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  pendingMessage: { textAlign: 'center', fontSize: 16, color: 'orange', marginTop: 40 },
  logoutButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#D90D32',
    alignItems: 'center',
  },
  logoutButtonText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
});
