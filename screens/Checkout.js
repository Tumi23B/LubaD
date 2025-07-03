import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView,
} from 'react-native';

export default function Checkout({ route, navigation }) {
  const { pickup, dropoff, date } = route.params;
 const readableDate = new Date(date);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

  const vehicleOptions = [
    { type: 'Mini Van', price: 150 },
    { type: 'Van', price: 200 },
    { type: 'Mini Truck', price: 250 },
    { type: 'Full Truck', price: 350 },
    { type: 'Passenger Van', price: 300 },
  ];

  return (
    <ScrollView style={styles.container}>
        
      <Text style={styles.title}>Confirm Your Trip</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.label}>Pickup:</Text>
        <Text style={styles.value}>{pickup}</Text>

        <Text style={styles.label}>Dropoff:</Text>
        <Text style={styles.value}>{dropoff}</Text>

        <Text style={styles.label}>Scheduled Time:</Text>
        <Text style={styles.value}>{new Date(date).toLocaleString()}</Text>
      </View>

      <Text style={styles.heading}>Choose a Vehicle</Text>
      {vehicleOptions.map((v, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.vehicleCard,
            selectedVehicle === v.type && styles.selectedVehicle,
          ]}
          onPress={() => setSelectedVehicle(v.type)}
        >
          <Text style={styles.vehicleText}>{v.type}</Text>
          <Text style={styles.price}>R{v.price}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Need help loading/unloading?</Text>
        <Switch value={loadingHelp} onValueChange={setLoadingHelp} />
      </View>

      <TouchableOpacity
  style={styles.confirmButton}
  onPress={() => {
    navigation.navigate('Payment', {
      vehicle: selectedVehicle,
      pickup,
      dropoff,
      date,
      helpWithLoading: loadingHelp,
    });
  }}
>
  <Text style={styles.confirmButtonText}>Confirm Booking</Text>
</TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#b80000',
    marginBottom: 20,
    marginTop:30,
    textAlign: 'center',
  },
  summaryBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderColor: '#c5a34f',
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  value: {
    marginBottom: 10,
    color: '#555',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b80000',
    marginBottom: 12,
  },
  vehicleCard: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#c5a34f',
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectedVehicle: {
    backgroundColor: '#fff8f8',
    borderColor: '#b80000',
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 16,
    color: '#c5a34f',
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
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#b80000',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#c5a34f',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
