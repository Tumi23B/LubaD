import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, database } from '../firebase';
import { ref, set } from 'firebase/database';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export default function DriverApplication({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [driverImage, setDriverImage] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [carImage, setCarImage] = useState(null);

  const pickImage = async (setImage) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need media library permissions to make this work!');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open image library');
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
      // Upload images to Cloudinary
      const [driverImageUrl, licensePhotoUrl, carImageUrl] = await Promise.all([
        uploadToCloudinary(driverImage),
        uploadToCloudinary(licensePhoto),
        uploadToCloudinary(carImage),
      ]);

      // Save application data to Realtime DB
      await set(ref(database, 'driverApplications/' + user.uid), {
        fullName,
        phoneNumber,
        address,
        status: 'approved',
        images: {
          driver: driverImageUrl,
          license: licensePhotoUrl,
          car: carImageUrl,
        },
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

        <Image
          source={require('../assets/logotransparent.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />

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

        <PhotoInput
          label="Driver Photo"
          image={driverImage}
          onSelect={() => pickImage(setDriverImage)}
        />

        <PhotoInput
          label="Driver License Photo"
          image={licensePhoto}
          onSelect={() => pickImage(setLicensePhoto)}
        />

        <PhotoInput
          label="Car Photo"
          image={carImage}
          onSelect={() => pickImage(setCarImage)}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 🔁 Reusable photo field component (inline for now)
function PhotoInput({ label, image, onSelect }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {image ? (
        <Image source={{ uri: image }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No photo selected</Text>
        </View>
      )}
      <TouchableOpacity style={styles.uploadButton} onPress={onSelect}>
        <Text style={styles.uploadButtonText}>Select Photo</Text>
      </TouchableOpacity>
    </View>
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
  logoImg: {
    width: 200,
    alignSelf: 'center',
    height: 200,
    marginVertical: 12,
  },
});
