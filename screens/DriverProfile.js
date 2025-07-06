import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, database } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut, deleteUser} from 'firebase/auth';
import { ref, get, update, remove } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';

export default function DriverProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverImage, setDriverImage] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [carImage, setCarImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === 'driverImage') setDriverImage(uri);
      else if (type === 'licensePhoto') setLicensePhoto(uri);
      else if (type === 'carImage') setCarImage(uri);

      const user = auth.currentUser;
      if (user) {
        const updateData = {};
        updateData[type] = uri;
        update(ref(database, 'driverApplications/' + user.uid), updateData).catch(() =>
          Alert.alert('Error', 'Failed to update image.')
        );
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
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navigate to AuthScreen and force login tab
      navigation.reset({
        index: 0,
        routes: [{ name: 'AuthScreen', params: { showLogin: true } }],
      });
    } catch (error) {
      Alert.alert('Error', error.message);
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
              // Navigate to App.js screen after deactivation
              navigation.reset({
                index: 0,
                routes: [{ name: 'App' }],
              });
            } catch (error) {
              Alert.alert('Error', error.message);
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
              // Navigate to App.js screen after deletion
              navigation.reset({
                index: 0,
                routes: [{ name: 'App' }],
              });
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b80000" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.noProfileText}>Driver profile not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>My Driver Profile</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.imageRow}
      >
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Driver Photo</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => pickImage('driverImage')}>
            {driverImage ? (
              <Image source={{ uri: driverImage }} style={styles.image} />
            ) : (
              <View style={[styles.imagePlaceholder, styles.image]}>
                <Ionicons name="camera" size={30} color="#b80000" />
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>License Photo</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => pickImage('licensePhoto')}>
            {licensePhoto ? (
              <Image source={{ uri: licensePhoto }} style={styles.image} />
            ) : (
              <View style={[styles.imagePlaceholder, styles.image]}>
                <Ionicons name="camera" size={30} color="#b80000" />
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Car Photo</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => pickImage('carImage')}>
            {carImage ? (
              <Image source={{ uri: carImage }} style={styles.image} />
            ) : (
              <View style={[styles.imagePlaceholder, styles.image]}>
                <Ionicons name="camera" size={30} color="#b80000" />
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.infoSection}>
        <Text style={styles.label}>Full Name:</Text>
        <Text style={styles.infoText}>{profile.fullName || 'N/A'}</Text>

        <Text style={styles.label}>Phone Number:</Text>
        <Text style={styles.infoText}>{profile.phoneNumber || 'N/A'}</Text>

        <Text style={styles.label}>Address:</Text>
        <Text style={styles.infoText}>{profile.address || 'N/A'}</Text>
      </View>

      <View style={styles.passwordSection}>
        <Text style={styles.label}>Change Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
          <Text style={styles.saveButtonText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deactivateButton} onPress={handleDeactivateAccount}>
        <Ionicons name="person-remove-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Deactivate Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fdf8f1',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#b80000',
    marginBottom: 20,
    textAlign: 'center',
    marginTop:40,
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
    color: '#b80000',
    fontSize: 16,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#b80000',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
  },
  placeholderText: {
    marginTop: 4,
    color: '#b80000',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 30,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 20,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    color: '#b80000',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 14,
    color: '#333',
    paddingLeft: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  passwordSection: {
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#b80000',
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#b80000',
    padding: 15,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#c5a34f',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  deactivateButton: {
    backgroundColor: '#e08900',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: '#b80000',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: {
    color: '#fff',
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
    color: '#999',
  },
});
