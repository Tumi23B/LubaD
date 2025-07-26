import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, database } from '../firebase';
import { ref, set } from 'firebase/database';
import { uploadToCloudinary } from '../utils/cloudinary';
import { ThemeContext } from '../ThemeContext';
import { Picker } from '@react-native-picker/picker';
import { LogBox } from 'react-native';

// Ignore specific warning messages
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

LogBox.ignoreLogs([
  'Firebase authentication error: Firebase: Error (auth/admin-restricted-operation).',
]);

export default function DriverApplication({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    vehicleType: 'mini van',
    registration: '',
    idNumber: '',
    driverImage: null,
    licensePhoto: null,
    carImage: null,
    idPhoto: null,
    helperCount: '0' // Changed to string to handle input properly
  });

  const [uploading, setUploading] = useState(false);

  const vehicleTypes = [
    { label: 'Mini Van', value: 'mini van' },
    { label: 'Van', value: 'van' },
    { label: 'Big Truck', value: 'big truck' },
    { label: 'Bakkie', value: 'bakkie' },
    { label: 'Mini Truck', value: 'mini truck' },
  ];

  const pickImage = async (field) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to upload images');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, [field]: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open image library');
    }
  };

  const validateIDNumber = (id) => /^\d{13}$/.test(id);

  const handleHelperCountChange = (text) => {
    // Allow empty string or numeric values between 0-3
    if (text === '' || (/^[0-3]$/.test(text))) {
      setFormData(prev => ({ ...prev, helperCount: text }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.address || !formData.idNumber || 
        !formData.driverImage || !formData.licensePhoto || !formData.carImage || !formData.idPhoto) {
      Alert.alert('Error', 'Please fill all fields and upload all required photos');
      return;
    }

    if (!validateIDNumber(formData.idNumber)) {
      Alert.alert('Error', 'Please enter a valid South African ID number (13 digits)');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setUploading(true);

    try {
      // Upload all images to Cloudinary
      const [driverImageUrl, licensePhotoUrl, carImageUrl, idPhotoUrl] = await Promise.all([
        uploadToCloudinary(formData.driverImage),
        uploadToCloudinary(formData.licensePhoto),
        uploadToCloudinary(formData.carImage),
        uploadToCloudinary(formData.idPhoto),
      ]);

      // Prepare application data
      const applicationData = {
        fullName: formData.fullName,
        address: formData.address,
        vehicleType: formData.vehicleType,
        registration: formData.registration,
        idNumber: formData.idNumber,
        helperCount: parseInt(formData.helperCount) || 0, // Convert to number
        status: 'Pending',
        images: {
          driver: driverImageUrl,
          license: licensePhotoUrl,
          car: carImageUrl,
          id: idPhotoUrl,
        },
        createdAt: new Date().toISOString(),
      };

      // Save to both application and driver profiles
      await Promise.all([
        set(ref(database, `driverApplications/${user.uid}`), applicationData),
        set(ref(database, `drivers/${user.uid}`), {
          fullName: formData.fullName,
          vehicleType: formData.vehicleType,
          registration: formData.registration,
          helperCount: parseInt(formData.helperCount) || 0,
          status: 'Pending',
          rating: 0,
          tripsCompleted: 0,
          profileImage: driverImageUrl,
          licenseImage: licensePhotoUrl,
          vehicleImage: carImageUrl,
          createdAt: new Date().toISOString(),
          uid: user.uid
        })
      ]);

      Alert.alert(
        'Application Submitted!',
        'Your application has been submitted and is awaiting review by the admin, check your emails within 12 hrs or log-in after 12 hrs.',
        [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            }),
          },
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setUploading(false);
    }
  };

  const PhotoInput = ({ label, field, required = true }) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label} {required && <Text style={{ color: colors.iconRed }}>*</Text>}
      </Text>
      {formData[field] ? (
        <Image source={{ uri: formData[field] }} style={styles.previewImage} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            No photo selected
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: colors.iconRed }]}
        onPress={() => pickImage(field)}
      >
        <Text style={[styles.uploadButtonText, { color: colors.buttonText }]}>
          {formData[field] ? 'Change Photo' : 'Select Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.iconRed }]}>Driver Application</Text>

        <Image
          source={require('../assets/logotransparent.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />

        {/* Personal Information */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Full Name <Text style={{ color: colors.iconRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Your full legal name"
            placeholderTextColor={colors.textSecondary}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Physical Address <Text style={{ color: colors.iconRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Your current residential address"
            placeholderTextColor={colors.textSecondary}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            multiline
          />
        </View>

        {/* Vehicle Information */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Vehicle Type <Text style={{ color: colors.iconRed }}>*</Text>
          </Text>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.borderColor,
              },
            ]}
          >
            <Picker
              selectedValue={formData.vehicleType}
              onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
              style={[styles.picker, { color: colors.text }]}
              dropdownIconColor={colors.text}
            >
              {vehicleTypes.map((type) => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </View>
        </View>
        
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            Vehicle Registration Number <Text style={{ color: colors.iconRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Enter vehicle number plate"
            placeholderTextColor={colors.textSecondary}
            value={formData.registration}
            onChangeText={(text) => setFormData({ ...formData, registration: text })}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>
            South African ID Number <Text style={{ color: colors.iconRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="13-digit ID number"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={formData.idNumber}
            onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
            maxLength={13}
          />
        </View>

        {/* Helper Count Input */}
        <View style={styles.field}>
          <Text style={[styles.helperInfoText, { color: colors.text }]}>
            Helpers are people who will assist with loading and unloading goods.
            Please indicate how many helpers you will have (maximum 3).
          </Text>
          <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>
            Number of Helpers
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cardBackground,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Enter 0-3"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={formData.helperCount}
            onChangeText={handleHelperCountChange}
            maxLength={1}
          />
        </View>

        {/* Photo Uploads */}
        <PhotoInput label="Your Photo" field="driverImage" />
        <PhotoInput label="Driver License Photo" field="licensePhoto" />
        <PhotoInput label="Vehicle Photo" field="carImage" />
        <PhotoInput label="ID Document Photo" field="idPhoto" />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { 
            backgroundColor: uploading ? colors.borderColor : colors.iconRed,
            opacity: uploading ? 0.7 : 1
          }]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.buttonText }]}>
              Submit Application
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 45,
    marginBottom: 20,
    textAlign: 'center',
  },
  logoImg: {
    width: 200,
    height: 180,
    alignSelf: 'center',
    marginBottom: 10,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  helperInfoText: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  placeholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
  },
  uploadButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});