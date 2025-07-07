import React, { useState, useEffect, useContext } from 'react'; // Import useContext
import {View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { auth, database } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut, deleteUser} from 'firebase/auth';
import { ref, get, update, remove } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../ThemeContext'; // Import ThemeContext

export default function DriverProfile() {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme and colors

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverImage, setDriverImage] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [carImage, setCarImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reactivating, setReactivating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Add editable fields for validation and editing
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profileErrors, setProfileErrors] = useState({});

  // Get navigation object
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const snapshot = await get(ref(database, 'driverApplications/' + user.uid));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfile(data);
          setDriverImage(data.driverImage || null);
          setLicensePhoto(data.licensePhoto || null);
          setCarImage(data.carImage || null);
          // Set editable fields
          setFullName(data.fullName || '');
          setPhoneNumber(data.phoneNumber || '');
          setAddress(data.address || '');
        }
      } catch (error) {
        console.warn('Failed to fetch profile:', error);
        Alert.alert('Error', 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Validation logic for profile fields
  const validateProfileFields = () => {
    let errors = {};
    let valid = true;

    if (!fullName.trim() || fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters.';
      valid = false;
    }
    if (!phoneNumber.trim() || !/^\d{10,15}$/.test(phoneNumber.trim())) {
      errors.phoneNumber = 'Enter a valid phone number (10-15 digits).';
      valid = false;
    }
    if (!address.trim() || address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters.';
      valid = false;
    }

    setProfileErrors(errors);
    return valid;
  };

  // Helper to get user-friendly error messages
  const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred.';
    if (error.code) {
      switch (error.code) {
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection and try again.';
        case 'auth/permission-denied':
          return 'You do not have permission to perform this action.';
        case 'auth/wrong-password':
          return 'The current password you entered is incorrect.';
        case 'auth/too-many-requests':
          return 'Too many requests. Please try again later.';
        case 'auth/user-not-found':
          return 'User not found. Please log in again.';
        default:
          return error.message || 'An error occurred. Please try again.';
      }
    }
    if (error.message && error.message.includes('Network')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    return error.message || 'An error occurred. Please try again.';
  };

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!validateProfileFields()) {
      return;
    }
    const user = auth.currentUser;
    if (!user) return;

    try {
      await update(ref(database, 'driverApplications/' + user.uid), {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
      });
      Alert.alert('Success', 'Profile updated successfully.');
      setProfile({
        ...profile,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
      });
      setProfileErrors({});
      setEditMode(false); // Exit edit mode after saving
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error), [
        { text: 'Retry', onPress: handleSaveProfile },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // Cloudinary config (replace with your own unsigned upload preset and cloud name)
  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dvxycdr6l/image/upload';
  const CLOUDINARY_UPLOAD_PRESET = 'driver profile images';

  // Helper to upload image to Cloudinary and return the URL
  const uploadToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.secure_url;
    } catch (error) {
      console.warn('Cloudinary upload error:', error);
      throw new Error('Failed to upload image.');
    }
  };

  // Update pickImage to use Cloudinary
  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      try {
        const imageUrl = await uploadToCloudinary(uri);

        if (type === 'driverImage') setDriverImage(imageUrl);
        else if (type === 'licensePhoto') setLicensePhoto(imageUrl);
        else if (type === 'carImage') setCarImage(imageUrl);

        const user = auth.currentUser;
        if (user) {
          const updateData = {};
          updateData[type] = imageUrl;
          await update(ref(database, 'driverApplications/' + user.uid), updateData);
        }
        Alert.alert('Success', 'Image uploaded successfully');
      } catch (error) {
        Alert.alert('Failed to upload image', getErrorMessage(error), [
          { text: 'Retry', onPress: () => pickImage(type) },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all password fields.');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match.');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'New password must be at least 6 characters.');
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error), [
        { text: 'Retry', onPress: handleChangePassword },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'AuthScreen', params: { showLogin: true } }],
      });
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error), [
        { text: 'Retry', onPress: handleLogout },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleDeactivateAccount = () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Deactivate Account',
      'Are you sure you want to deactivate your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await update(ref(database, 'driverApplications/' + user.uid), { active: false });
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'App' }],
              });
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error), [
                { text: 'Retry', onPress: handleDeactivateAccount },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Delete Account',
      'This will permanently delete your account. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await remove(ref(database, 'driverApplications/' + user.uid));
              await deleteUser(user);
              navigation.reset({
                index: 0,
                routes: [{ name: 'App' }],
              });
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error), [
                { text: 'Retry', onPress: handleDeleteAccount },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }
          },
        },
      ]
    );
  };

  const handleReactivateAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setReactivating(true);
    try {
      await update(ref(database, 'driverApplications/' + user.uid), { active: true });
      Alert.alert('Account Reactivated', 'Your account is now active again.');
      const snapshot = await get(ref(database, 'driverApplications/' + user.uid));
      if (snapshot.exists()) {
        setProfile(snapshot.val());
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error), [
        { text: 'Retry', onPress: handleReactivateAccount },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      setReactivating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> {/* Apply background color */}
        <ActivityIndicator size="large" color={colors.iconRed} /> {/* Apply indicator color */}
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> {/* Apply background color */}
        <Text style={[styles.noProfileText, { color: colors.textSecondary }]}>Driver profile not found.</Text> {/* Apply text color */}
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled"> {/* Apply background color */}
      <Text style={[styles.title, { color: colors.iconRed }]}>My Driver Profile</Text> {/* Apply title text color */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.imageRow}
      >
        <View style={styles.imageContainer}>
          <Text style={[styles.imageLabel, { color: colors.iconRed }]}>Driver Photo</Text> {/* Apply label text color */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => pickImage('driverImage')}>
            {driverImage ? (
              <Image source={{ uri: driverImage }} style={[styles.image, { borderColor: colors.iconRed }]} /> /* Apply border color */
            ) : (
              <View style={[styles.imagePlaceholder, styles.image, { backgroundColor: colors.imagePlaceholderBackground, borderColor: colors.iconRed }]}> {/* Apply colors */}
                <Ionicons name="camera" size={30} color={colors.iconRed} /> {/* Apply icon color */}
                <Text style={[styles.placeholderText, { color: colors.iconRed }]}>Add Photo</Text> {/* Apply text color */}
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Text style={[styles.imageLabel, { color: colors.iconRed }]}>License Photo</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => pickImage('licensePhoto')}>
            {licensePhoto ? (
              <Image source={{ uri: licensePhoto }} style={[styles.image, { borderColor: colors.iconRed }]} />
            ) : (
              <View style={[styles.imagePlaceholder, styles.image, { backgroundColor: colors.imagePlaceholderBackground, borderColor: colors.iconRed }]}>
                <Ionicons name="camera" size={30} color={colors.iconRed} />
                <Text style={[styles.placeholderText, { color: colors.iconRed }]}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Text style={[styles.imageLabel, { color: colors.iconRed }]}>Car Photo</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => pickImage('carImage')}>
            {carImage ? (
              <Image source={{ uri: carImage }} style={[styles.image, { borderColor: colors.iconRed }]} />
            ) : (
              <View style={[styles.imagePlaceholder, styles.image, { backgroundColor: colors.imagePlaceholderBackground, borderColor: colors.iconRed }]}>
                <Ionicons name="camera" size={30} color={colors.iconRed} />
                <Text style={[styles.placeholderText, { color: colors.iconRed }]}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.infoSection, { borderTopColor: colors.borderColor }]}> {/* Apply border color */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.label, { color: colors.iconRed }]}>Profile Information</Text> {/* Apply label text color */}
          {!editMode ? (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <Ionicons name="create-outline" size={22} color={colors.iconRed} /> {/* Apply icon color */}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Editable fields */}
        <Text style={[styles.label, { color: colors.iconRed }]}>Full Name:</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: editMode ? colors.inputBackground : colors.inputDisabledBackground, // Conditional background
              color: editMode ? colors.text : colors.textSecondary, // Conditional text color
              borderColor: colors.iconRed, // Always red border
            },
          ]}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full Name"
          placeholderTextColor={colors.placeholderText} // Placeholder color
          editable={editMode}
        />
        {profileErrors.fullName && (
          <Text style={[styles.errorText, { color: colors.errorText }]}>{profileErrors.fullName}</Text> /* Apply error text color */
        )}

        <Text style={[styles.label, { color: colors.iconRed }]}>Phone Number:</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: editMode ? colors.inputBackground : colors.inputDisabledBackground,
              color: editMode ? colors.text : colors.textSecondary,
              borderColor: colors.iconRed,
            },
          ]}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Phone Number"
          placeholderTextColor={colors.placeholderText}
          keyboardType="phone-pad"
          editable={editMode}
        />
        {profileErrors.phoneNumber && (
          <Text style={[styles.errorText, { color: colors.errorText }]}>{profileErrors.phoneNumber}</Text>
        )}

        <Text style={[styles.label, { color: colors.iconRed }]}>Address:</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: editMode ? colors.inputBackground : colors.inputDisabledBackground,
              color: editMode ? colors.text : colors.textSecondary,
              borderColor: colors.iconRed,
            },
          ]}
          value={address}
          onChangeText={setAddress}
          placeholder="Address"
          placeholderTextColor={colors.placeholderText}
          editable={editMode}
        />
        {profileErrors.address && (
          <Text style={[styles.errorText, { color: colors.errorText }]}>{profileErrors.address}</Text>
        )}

        {/* Save and Cancel buttons in edit mode */}
        {editMode && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.iconRed }]} onPress={handleSaveProfile}>
              <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Save</Text> {/* Apply button text color */}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.buttonSecondary }]} // Apply secondary button color
              onPress={() => {
                setFullName(profile.fullName || '');
                setPhoneNumber(profile.phoneNumber || '');
                setAddress(profile.address || '');
                setProfileErrors({});
                setEditMode(false);
              }}
            >
              <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show reactivation button if account is inactive */}
        {profile.active === false && (
          <TouchableOpacity
            style={[styles.reactivateButton, { backgroundColor: colors.successButton }]} // Apply success button color
            onPress={handleReactivateAccount}
            disabled={reactivating}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.buttonText} />
            <Text style={[styles.logoutText, { color: colors.buttonText }]}>
              {reactivating ? 'Reactivating...' : 'Reactivate Account'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.passwordSection}>
        <Text style={[styles.label, { color: colors.iconRed }]}>Change Password</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.iconRed,
              color: colors.text,
            },
          ]}
          placeholder="Current Password"
          placeholderTextColor={colors.placeholderText}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.iconRed,
              color: colors.text,
            },
          ]}
          placeholder="New Password"
          placeholderTextColor={colors.placeholderText}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.iconRed,
              color: colors.text,
            },
          ]}
          placeholder="Confirm New Password"
          placeholderTextColor={colors.placeholderText}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.iconRed }]} onPress={handleChangePassword}>
          <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Update Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.accentYellow }]} onPress={handleLogout}> {/* Apply accent color */}
        <Ionicons name="log-out-outline" size={18} color={colors.buttonText} />
        <Text style={[styles.logoutText, { color: colors.buttonText }]}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.deactivateButton, { backgroundColor: colors.warningButton }]} onPress={handleDeactivateAccount}> {/* Apply warning color */}
        <Ionicons name="person-remove-outline" size={18} color={colors.buttonText} />
        <Text style={[styles.logoutText, { color: colors.buttonText }]}>Deactivate Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.dangerButton }]} onPress={handleDeleteAccount}> {/* Apply danger color */}
        <Ionicons name="trash-outline" size={18} color={colors.buttonText} />
        <Text style={[styles.logoutText, { color: colors.buttonText }]}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 40,
  },
  horizontalScroll: {
    marginBottom: 30,
  },
  imageRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  imageLabel: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 12,
    borderWidth: 2,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 30,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    paddingTop: 20,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  infoText: { // This style is not used, can be removed if not intended for future use
    fontSize: 18,
    marginBottom: 14,
    paddingLeft: 6,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  passwordSection: {
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  saveButtonText: {
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  logoutButton: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  deactivateButton: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteButton: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  reactivateButton: {
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  logoutText: {
    fontWeight: '700',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  noProfileText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
});