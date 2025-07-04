import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, database } from '../firebase';
import { ref, set } from 'firebase/database';

export default function DriverApplication({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [driverImage, setDriverImage] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [carImage, setCarImage] = useState(null);

  const pickImage = async (setImage) => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant media library permissions to select an image.');
        return;
      }

      // Launch image library picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        // Assign selected image URI
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open image gallery. Please try again.');
      console.error('ImagePicker error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !phoneNumber || !address || !driverImage || !licensePhoto || !carImage) {
      Alert.alert('Error', 'Please fill all fields and upload all photos.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      await set(ref(database, 'driverApplications/' + user.uid), {
        fullName,
        phoneNumber,
        address,
        status: 'approved', // Temporary auto-approval for testing
        driverImage,
        licensePhoto,
        carImage,
      });

      Alert.alert('Application Submitted', 'You can now access the Driver Dashboard.');
      navigation.navigate('DriverDashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Driver Application</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Physical address"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Driver Photo</Text>
          {driverImage ? (
            <Image source={{ uri: driverImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No driver photo selected</Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setDriverImage)}>
            <Text style={styles.uploadButtonText}>Select Driver Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Driver License Photo</Text>
          {licensePhoto ? (
            <Image source={{ uri: licensePhoto }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No license photo selected</Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setLicensePhoto)}>
            <Text style={styles.uploadButtonText}>Select License Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Car Photo</Text>
          {carImage ? (
            <Image source={{ uri: carImage }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No car photo selected</Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setCarImage)}>
            <Text style={styles.uploadButtonText}>Select Car Photo</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    color: '#b80000',
    textAlign: 'center',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#c5a34f',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  uploadButton: {
    backgroundColor: '#b80000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadButtonText: {
    color: '#c5a34f',
    fontWeight: '600',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  placeholder: {
    height: 180,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#b80000',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#c5a34f',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
