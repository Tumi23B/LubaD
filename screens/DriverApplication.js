import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, database } from '../firebase';
import { ref, set } from 'firebase/database';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ThemeContext } from '../ThemeContext';

export default function DriverApplication({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme

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

  // Reusable photo field component (inline for now)
  function PhotoInput({ label, image, onSelect }) {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>No photo selected</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.uploadButton, { backgroundColor: colors.iconRed }]} onPress={onSelect}>
          <Text style={[styles.uploadButtonText, { color: colors.buttonText }]}>Select Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.iconRed }]}>Driver Application</Text>

        <Image
          source={require('../assets/logotransparent.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Your full name"
            placeholderTextColor={colors.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Phone number"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Address</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Physical address"
            placeholderTextColor={colors.textSecondary}
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

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.iconRed }]} onPress={handleSubmit}>
          <Text style={[styles.submitButtonText, { color: colors.buttonText }]}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    // backgroundColor handled by theme
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'center',
    // color handled by theme
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    // color handled by theme
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    // borderColor, backgroundColor, color handled by theme
  },
  uploadButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    // backgroundColor handled by theme
  },
  uploadButtonText: {
    fontWeight: '600',
    fontSize: 16,
    // color handled by theme
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  placeholder: {
    height: 180,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor handled by theme
  },
  placeholderText: {
    fontStyle: 'italic',
    // color handled by theme
  },
  submitButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
    // backgroundColor handled by theme
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    // color handled by theme
  },
  logoImg: {
    width: 200,
    alignSelf: 'center',
    height: 200,
    marginVertical: 12,
  },
});
