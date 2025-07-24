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

{/*Or ignore all logs (not recommended unless you're demoing)
LogBox.ignoreAllLogs(true);*/}

export default function DriverApplication({ navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    vehicleType: 'mini van',
    registration: '', // vehicle registration number
    idNumber: '',
    driverImage: null,
    licensePhoto: null,
    carImage: null,
    idPhoto: null
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
        status: 'Pending', // Changed from 'approved' to 'Pending'
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
          status: 'Pending', // Changed from 'active' to 'Pending'
          rating: 0,
          tripsCompleted: 0,
          profileImage: driverImageUrl,
          licenseImage: licensePhotoUrl,
          vehicleImage: carImageUrl,
          createdAt: new Date().toISOString(),
          uid: user.uid // Add UID for easier reference in admin panel
        })
      ]);

      Alert.alert(
        'Application Submitted!', // Changed message
        'Your application has been submitted and is awaiting review by the admin.', // Changed message
        [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }], // Navigate to a more appropriate screen after submission
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
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  uploadButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  uploadButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  placeholder: {
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 5,
  },
  placeholderText: {
    fontStyle: 'italic',
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoImg: {
    width: 200,
    height: 100,
    alignSelf: 'center',
    marginVertical: 10,
  },
});