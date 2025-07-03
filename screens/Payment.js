import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function Payment() {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const methods = ['Cash', 'Card', 'Apple Pay'];

  const handlePayPress = () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose how you want to pay.');
      return;
    }

    switch (selectedMethod) {
      case 'Cash':
        Alert.alert('Cash Payment', 'You chose to pay with cash on delivery.');
        break;
      case 'Card':
        Alert.alert('Card Payment', 'Card payment option selected. (No real payment logic yet)');
        break;
      case 'Apple Pay':
        Alert.alert('Apple Pay', 'Apple Pay option selected. (No real payment logic yet)');
        break;
      default:
        Alert.alert('Error', 'Unknown payment method selected.');
    }
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f0f0f0', flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#b80000',
    marginBottom: 20,
    marginTop:40,
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
});
