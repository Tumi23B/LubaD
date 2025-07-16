import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Switch, Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, database } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut, deleteUser } from 'firebase/auth';
import { ref, get, update, remove } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width } = Dimensions.get('window');

export default function DriverProfile() {
  const { isDarkMode, colors, toggleTheme } = useContext(ThemeContext);
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    vehicleType: '',
    rating: 0,
    tripsCompleted: 0,
    onlineStatus: false,
    profileImage: null,
    licenseImage: null,
    vehicleImage: null
  });
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const [editingPhone, setEditingPhone] = useState(false);
  const [tempPhoneNumber, setTempPhoneNumber] = useState('');


  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone || phone === '') return 'Not provided';
    
    const cleaned = String(phone).replace(/\D/g, '');
    
    if (cleaned.length === 11 && cleaned.startsWith('27')) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    if (cleaned.length === 9) {
      return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
    }
    return phone;
  };

  {/* Fetch driver profile */}
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [profileSnapshot, applicationSnapshot] = await Promise.all([
          get(ref(database, `drivers/${user.uid}`)),
          get(ref(database, `driverApplications/${user.uid}`))
        ]);

        const profileData = profileSnapshot.exists() ? profileSnapshot.val() : {};
        const applicationData = applicationSnapshot.exists() ? applicationSnapshot.val() : {};

        {/* Get phone number with priority: Auth > Profile > Application*/}
        const phoneNumber = user.phoneNumber || 
                          profileData.phoneNumber || 
                          applicationData.phoneNumber || 
                          '';
        {/* ensures that tempPhoneNumber reflects the accurate, pre-filled value when the screen loads */}
        setTempPhoneNumber(phoneNumber);

        setProfile({
          ...profileData,
          phoneNumber,
          profileImage: profileData.profileImage || applicationData.images?.driver,
          licenseImage: profileData.licenseImage || applicationData.images?.license,
          vehicleImage: profileData.vehicleImage || applicationData.images?.car,
          fullName: profileData.fullName || applicationData.fullName || '',
          address: profileData.address || applicationData.address || '',
          vehicleType: profileData.vehicleType || applicationData.vehicleType || '',
          rating: profileData.rating || 0,
          tripsCompleted: profileData.tripsCompleted || 0,
          onlineStatus: profileData.onlineStatus || false,
          email: user.email
        });

      } catch (error) {
        Alert.alert('Error', 'Failed to load profile data');
        console.error('Profile fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  {/* Validation Function for phone numbers*/}
  const validateSAPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return /^(\+?27|0)\d{9}$/.test(cleaned);
};


  const validateFields = () => {
    const newErrors = {};
    if (!profile.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!profile.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!profile.address.trim()) newErrors.address = 'Address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  {/* Phone Update Handler*/}
  const handleUpdatePhoneNumber = async () => {
  if (!validateSAPhoneNumber(tempPhoneNumber)) {
    setErrors(prev => ({ ...prev, phoneNumber: 'Enter a valid SA number' }));
    return;
  }
  try {
    const user = auth.currentUser;
    const cleanedPhone = tempPhoneNumber.replace(/\D/g, '');
    await update(ref(database, `drivers/${user.uid}`), { phoneNumber: cleanedPhone });
    setProfile(prev => ({ ...prev, phoneNumber: cleanedPhone }));
    setEditingPhone(false);
    setErrors({});
    Alert.alert('Success', 'Phone number updated');
  } catch (error) {
    Alert.alert('Error', error.message);
    console.error('Phone update error:', error);
  }
};

  const handleSaveProfile = async () => {
    if (!validateFields()) return;

    try {
      const user = auth.currentUser;
      const updateData = {
        fullName: profile.fullName.trim(),
        phoneNumber: profile.phoneNumber.trim(),
        address: profile.address.trim(),
        vehicleType: profile.vehicleType.trim()
      };

      await update(ref(database, `drivers/${user.uid}`), updateData);
      Alert.alert('Success', 'Profile updated successfully');
      setEditMode(false);
      setErrors({});
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Profile update error:', error);
    }
  };

  const pickImage = async (type) => {
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

      if (!result.canceled && result.assets && result.assets[0]) {
        const updatedProfile = { ...profile, [type]: result.assets[0].uri };
        setProfile(updatedProfile);
        
        const user = auth.currentUser;
        await update(ref(database, `drivers/${user.uid}`), { [type]: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
      console.error('Image selection error:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all password fields');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('Password update error:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'default',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }]
              });
            } catch (error) {
              Alert.alert('Error', error.message);
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              await remove(ref(database, `drivers/${user.uid}`));
              await remove(ref(database, `driverApplications/${user.uid}`));
              await deleteUser(user);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }]
              });
            } catch (error) {
              Alert.alert('Error', error.message);
              console.error('Delete account error:', error);
            }
          }
        }
      ]
    );
  };

  const toggleOnlineStatus = async () => {
    try {
      const user = auth.currentUser;
      const newStatus = !profile.onlineStatus;
      await update(ref(database, `drivers/${user.uid}`), { onlineStatus: newStatus });
      setProfile(prev => ({ ...prev, onlineStatus: newStatus }));
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
      console.error('Status update error:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#C41E3A" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#C41E3A' }]}>My Driver Profile</Text>
        <View style={styles.themeToggleContainer}>
          <Ionicons 
            name={isDarkMode ? 'moon' : 'sunny'} 
            size={20} 
            color={isDarkMode ? '#FFD700' : '#C41E3A'} 
          />
          <Switch
            trackColor={{ false: '#767577', true: '#FFD700' }}
            thumbColor={isDarkMode ? '#C41E3A' : '#FFD700'}
            onValueChange={toggleTheme}
            value={isDarkMode}
            style={styles.themeSwitch}
          />
        </View>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => pickImage('profileImage')}>
            <Image
              source={profile.profileImage ? 
                { uri: profile.profileImage } : 
                require('../assets/icon.png')}
              style={[styles.avatar, { borderColor: '#C41E3A' }]}
            />
            <View style={[styles.cameraIcon, { backgroundColor: '#C41E3A' }]}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile.fullName || 'Driver Name'}
            </Text>
            
            {/* Phone Number Display */}
            <View style={styles.phoneContainer}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                {formatPhoneNumber(profile.phoneNumber)}
              </Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {profile.rating ? profile.rating.toFixed(1) : 'New'}
              </Text>
              <Text style={[styles.tripsText, { color: colors.textSecondary }]}>
                • {profile.tripsCompleted || 0} trips
              </Text>
            </View>
            
            <View style={styles.onlineStatusContainer}>
              <View 
                style={[
                  styles.statusIndicator, 
                  { backgroundColor: profile.onlineStatus ? '#4CAF50' : '#F44336' }
                ]} 
              />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {profile.onlineStatus ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={profile.onlineStatus}
                onValueChange={toggleOnlineStatus}
                trackColor={{ false: colors.border, true: '#C41E3A' }}
                thumbColor={profile.onlineStatus ? 'white' : 'white'}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Driver's License Section */}
      <View style={[styles.imageCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
        <Text style={[styles.sectionTitle, { color: '#C41E3A' }]}>Driver's License</Text>
        <TouchableOpacity 
          onPress={() => pickImage('licenseImage')}
          style={styles.imageTouchable}
        >
          {profile.licenseImage ? (
            <Image 
              source={{ uri: profile.licenseImage }} 
              style={[styles.largeImage, { borderColor: '#C41E3A' }]} 
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.largeImagePlaceholder, { backgroundColor: isDarkMode ? '#3A3A3A' : '#EAEAEA' }]}>
              <MaterialIcons name="card-membership" size={40} color="#C41E3A" />
              <Text style={[styles.placeholderText, { color: colors.text }]}>Add License Photo</Text>
            </View>
          )}
          <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons name="camera" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Vehicle Section */}
      <View style={[styles.imageCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
        <Text style={[styles.sectionTitle, { color: '#C41E3A' }]}>Vehicle Information</Text>
        <View style={styles.vehicleDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {profile.vehicleType || 'Not specified'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={() => pickImage('vehicleImage')}
          style={styles.imageTouchable}
        >
          {profile.vehicleImage ? (
            <Image 
              source={{ uri: profile.vehicleImage }} 
              style={[styles.largeImage, { borderColor: '#C41E3A' }]} 
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.largeImagePlaceholder, { backgroundColor: isDarkMode ? '#3A3A3A' : '#EAEAEA' }]}>
              <Ionicons name="car-sport" size={40} color="#C41E3A" />
              <Text style={[styles.placeholderText, { color: colors.text }]}>Add Vehicle Photo</Text>
            </View>
          )}
          <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons name="camera" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Contact Information */}
      <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
        <Text style={[styles.sectionTitle, { color: '#C41E3A' }]}>Contact Information</Text>

        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.detailValue, { color: colors.text }]}>{profile.email}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
          {editingPhone ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    backgroundColor: isDarkMode ? '#3A3A3A' : '#FFFFFF',
                    color: colors.text,
                    borderColor: errors.phoneNumber ? '#F44336' : '#C41E3A',
                  },
                ]}
                value={tempPhoneNumber}
                onChangeText={(text) => {
                  setTempPhoneNumber(text);
                  setErrors(prev => ({ ...prev, phoneNumber: '' }));
                }}
                placeholder="Phone number"
                keyboardType="phone-pad"
                placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
              <View style={styles.phoneButtonRow}>
                <TouchableOpacity
                  onPress={handleUpdatePhoneNumber}
                  style={[styles.phoneActionButton, { backgroundColor: '#b80000' }]}
                >
                  <Text style={[styles.phoneActionText, { color: '#c5a34f' }]}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditingPhone(false);
                    setTempPhoneNumber(profile.phoneNumber);
                    setErrors({});
                  }}
                  style={[styles.phoneActionButton, { backgroundColor: '#b80000' }]}
                >
                  <Text style={[styles.phoneActionText, { color: '#c5a34f' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingPhone(true)}>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatPhoneNumber(profile.phoneNumber)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="home-outline" size={20} color={colors.textSecondary} />
          {editMode ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    backgroundColor: isDarkMode ? '#3A3A3A' : '#FFFFFF',
                    color: colors.text,
                    borderColor: errors.address ? '#F44336' : '#C41E3A',
                  },
                ]}
                value={profile.address}
                onChangeText={text => setProfile({ ...profile, address: text })}
                placeholder="Address"
                placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>
          ) : (
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {profile.address || 'Not specified'}
            </Text>
          )}
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={20} color={colors.textSecondary} />
          {editMode ? (
            <TextInput
              style={[
                styles.editInput,
                {
                  backgroundColor: isDarkMode ? '#3A3A3A' : '#FFFFFF',
                  color: colors.text,
                  borderColor: '#C41E3A',
                },
              ]}
              value={profile.vehicleType}
              onChangeText={text => setProfile({ ...profile, vehicleType: text })}
              placeholder="Vehicle type"
              placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
            />
          ) : (
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {profile.vehicleType || 'Not specified'}
            </Text>
          )}
        </View>
      </View>

      {/* Edit/Save Buttons */}
      <View style={styles.buttonContainer}>
        {editMode ? (
          <>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#C41E3A' }]}
              onPress={handleSaveProfile}
            >
              <LinearGradient
                colors={['#C41E3A', '#A51930']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#FFD700' }]}
              onPress={() => {
                setErrors({});
                setEditMode(false);
              }}
            >
              <Text style={[styles.buttonText, { color: '#000000' }]}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#C41E3A' }]}
            onPress={() => setEditMode(true)}
          >
            <LinearGradient
              colors={['#C41E3A', '#A51930']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Password Change Section */}
      <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
        <Text style={[styles.sectionTitle, { color: '#C41E3A' }]}>Change Password</Text>
        
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#3A3A3A' : '#FFFFFF',
              color: colors.text,
              borderColor: '#C41E3A',
            },
          ]}
          placeholder="Current Password"
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#3A3A3A' : '#FFFFFF',
              color: colors.text,
              borderColor: '#C41E3A',
            },
          ]}
          placeholder="New Password"
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDarkMode ? '#3A3A3A' : '#FFFFFF',
              color: colors.text,
              borderColor: '#C41E3A',
            },
          ]}
          placeholder="Confirm New Password"
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#b80000' }]}
          onPress={handleChangePassword}
        >
          <LinearGradient
            colors={['#C41E3A', '#A51930']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Update Password</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8' }]}>
        <Text style={[styles.sectionTitle, { color: '#C41E3A' }]}>Account Actions</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#c5a34f' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fefefefe" />
          <Text style={[styles.actionButtonText, { color: '#fefefefe' }]}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#8B0000' }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 2,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 6,
    borderRadius: 20,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    marginRight: 8,
    fontSize: 14,
  },
  tripsText: {
    fontSize: 14,
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    marginRight: 8,
  },
  imageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  largeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
  },
  largeImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageTouchable: {
    position: 'relative',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 8,
    borderRadius: 20,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    marginRight: 8,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  inputContainer: {
    flex: 1,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradientButton: {
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  actionButton: {
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  phoneButtonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 12,
},
// phone number button styles
phoneActionButton: {
  flex: 1,
  paddingVertical: 10,
  borderRadius: 6,
  marginHorizontal: 4,
  alignItems: 'center',
},

phoneActionText: {
  fontWeight: 'bold',
  fontSize: 14,
  color: 'white',
},

});