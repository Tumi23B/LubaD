import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

export default function Payment({ route, navigation }) {
  const { vehicle, pickup, dropoff, date, helpWithLoading } = route.params;

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);

  const methods = ['Cash', 'Card', 'Apple Pay'];

  const handlePayPress = () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose how you want to pay.');
      return;
    }

    Alert.alert('Payment Successful', `You selected ${selectedMethod}.`);
    setPaymentDone(true);
  };

  const handleChatPress = () => {
    navigation.navigate('ChatScreen', {
      bookingId: 'ABC123',
      driverName: 'John Doe',
      driverPhone: '+1234567890',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!paymentDone ? (
        <>
          <Text style={styles.title}>Choose Payment Method</Text>
          {methods.map((method, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.methodButton,
                selectedMethod === method && styles.selectedMethod,
              ]}
              onPress={() => setSelectedMethod(method)}
            >
              <Text
                style={[
                  styles.methodText,
                  selectedMethod === method && styles.selectedMethodText,
                ]}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.confirmButton} onPress={handlePayPress}>
            <Text style={styles.confirmButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Booking Summary</Text>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Pickup Location:</Text>
            <Text style={styles.value}>{pickup}</Text>

            <Text style={styles.label}>Dropoff Location:</Text>
            <Text style={styles.value}>{dropoff}</Text>

            <Text style={styles.label}>Date & Time:</Text>
            <Text style={styles.value}>{new Date(date).toLocaleString()}</Text>

            <Text style={styles.label}>Vehicle Selected:</Text>
            <Text style={styles.value}>{vehicle || 'N/A'}</Text>

            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>{selectedMethod}</Text>

            <Text style={styles.label}>Assistance Needed:</Text>
            <Text style={styles.value}>
              {helpWithLoading ? 'Yes, help with loading/unloading' : 'No'}
            </Text>
          </View>

          <TouchableOpacity style={styles.chatButton} onPress={handleChatPress}>
            <Text style={styles.chatButtonText}>Chat with Driver</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#b80000',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'center',
  },
  methodButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderColor: '#c5a34f',
    borderWidth: 1,
    marginBottom: 12,
  },
  selectedMethod: {
    backgroundColor: '#fff8f8',
    borderColor: '#b80000',
  },
  methodText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedMethodText: {
    color: '#b80000',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#b80000',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#c5a34f',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderColor: '#c5a34f',
    borderWidth: 1,
    marginTop: 20,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  value: {
    color: '#555',
    marginTop: 4,
  },
  chatButton: {
    backgroundColor: '#b80000',
    padding: 14,
    borderRadius: 10,
    marginTop: 30,
  },
  chatButtonText: {
    color: '#c5a34f',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
});
