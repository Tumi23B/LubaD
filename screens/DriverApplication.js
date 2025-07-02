import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function DriverApplication({ navigation }) {
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleSubmit = () => {
    // Firebase logic goes here later
    alert('Application submitted! Waiting for admin approval.');
    navigation.goBack(); // Or navigate to a pending screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Application</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Car Model" 
        value={carModel} 
        onChangeText={setCarModel} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="License Plate" 
        value={licensePlate} 
        onChangeText={setLicensePlate} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Driver's License Number" 
        value={licenseNumber} 
        onChangeText={setLicenseNumber} 
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Application</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { 
    height: 50, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    marginBottom: 15 
  },
  button: { 
    backgroundColor: '#D90D32', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#FFD700', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});
