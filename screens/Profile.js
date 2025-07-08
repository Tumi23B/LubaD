import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, database } from '../firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref, get, update, remove, set } from 'firebase/database';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const lightModeLogo = require('../assets/logotransparent.png');
const darkModeLogo = require('../assets/logo-dark-mode.png');

export default function Profile() {
  const { isDarkMode, colors } = useContext(ThemeContext);
  const [profile, setProfile] = useState({ 
    name: '', 
    email: '', 
    phoneNumber: '' 
  });
  const [image, setImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [tempPhoneNumber, setTempPhoneNumber] = useState('');
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = ref(database, 'users/' + user.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfile({
            name: data.username || '',
            email: user.email || '',
            phoneNumber: data.phoneNumber || ''
          });
          setTempPhoneNumber(data.phoneNumber || '');
          if (data.imageUrl) {
            setImage(data.imageUrl);
          }
        }
      }
    };

    fetchProfile();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const imageUrl = await uploadToCloudinary(uri);
      setImage(imageUrl);

      const user = auth.currentUser;
      const userRef = ref(database, 'users/' + user.uid);
      await update(userRef, { imageUrl });
      Alert.alert('Success', 'Profile picture updated successfully');
    }
  };

  const validateSAPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(\+?27|0)\d{9}$/.test(cleaned);
  };

  const handleUpdatePhoneNumber = async () => {
    if (!validateSAPhoneNumber(tempPhoneNumber)) {
      setErrors({ phoneNumber: 'Enter a valid South African phone number' });
      return;
    }

    try {
      const user = auth.currentUser;
      const userRef = ref(database, 'users/' + user.uid);
      const cleanedPhone = tempPhoneNumber.replace(/\D/g, '');
      
      await update(userRef, { phoneNumber: cleanedPhone });
      setProfile({ ...profile, phoneNumber: cleanedPhone });
      setEditingPhone(false);
      Alert.alert('Success', 'Phone number updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all password fields');
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match');
    }

    if (newPassword.length < 6) {
      return Alert.alert('Error', 'New password must be at least 6 characters');
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
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth', params: { showLogin: true } }],
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
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(ref(database, 'users/' + user.uid));
              await deleteUser(user);
              Alert.alert('Deleted', 'Your account has been removed.');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const uploadToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });
    formData.append('upload_preset', 'driver profile images');
    formData.append('cloud_name', 'dvxycdr6l');

    const response = await fetch('https://api.cloudinary.com/v1_1/dvxycdr6l/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data.secure_url;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Not provided';
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as +27 82 123 4567
    if (cleaned.length === 11 && cleaned.startsWith('27')) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }
    // Format as 082 123 4567
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    return phone;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.iconRed }]}>Your Profile</Text>

        <View style={styles.center}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
            <Image
              source={image ? { uri: image } : isDarkMode ? darkModeLogo : lightModeLogo}
              style={[styles.avatar, { backgroundColor: colors.borderColor }]}
            />
            <View style={[styles.cameraIcon, { backgroundColor: colors.iconRed }]}>
              <Ionicons name="camera" size={20} color={colors.buttonText} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: colors.iconRed }]}>{profile.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{profile.email}</Text>
          
          {/* Phone Number Section */}
          <View style={styles.phoneContainer}>
            <Ionicons 
              name="call-outline" 
              size={16} 
              color={colors.textSecondary} 
              style={styles.phoneIcon}
            />
            {editingPhone ? (
              <View style={styles.phoneEditContainer}>
                <TextInput
                  style={[
                    styles.phoneInput,
                    { 
                      backgroundColor: colors.cardBackground,
                      color: colors.text,
                      borderColor: colors.borderColor
                    }
                  ]}
                  value={tempPhoneNumber}
                  onChangeText={(text) => {
                    setTempPhoneNumber(text);
                    setErrors({ ...errors, phoneNumber: '' });
                  }}
                  placeholder="Enter SA phone number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
                {errors.phoneNumber && (
                  <Text style={[styles.errorText, { color: colors.iconRed }]}>
                    {errors.phoneNumber}
                  </Text>
                )}
                <View style={styles.phoneButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.phoneButton, { backgroundColor: colors.iconRed }]}
                    onPress={handleUpdatePhoneNumber}
                  >
                    <Text style={[styles.phoneButtonText, { color: colors.buttonText }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.phoneButton, { backgroundColor: colors.borderColor }]}
                    onPress={() => {
                      setEditingPhone(false);
                      setErrors({ ...errors, phoneNumber: '' });
                    }}
                  >
                    <Text style={[styles.phoneButtonText, { color: colors.background }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={[styles.phoneText, { color: colors.textSecondary }]}>
                  {formatPhoneNumber(profile.phoneNumber)}
                </Text>
                <TouchableOpacity 
                  style={styles.editIcon}
                  onPress={() => setEditingPhone(true)}
                >
                  <Ionicons 
                    name="pencil-outline" 
                    size={16} 
                    color={colors.iconRed} 
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons key={i} name="star" size={20} color={colors.borderColor} />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.label, { color: colors.iconRed }]}>Change Password</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Current Password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="New Password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.borderColor,
              },
            ]}
            placeholder="Confirm New Password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleChangePassword}
          >
            <LinearGradient
              colors={['#ebd197', '#b48811', '#a2790d', '#bb9b49']}
              style={styles.gradientButton}
            >
              <Text style={styles.saveButtonText}>Update Password</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.borderColor }]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.background} />
            <Text style={[styles.logoutText, { color: colors.background }]}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.deleteButton, { backgroundColor: colors.iconRed }]} 
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={18} color={colors.buttonText} />
            <Text style={[styles.logoutText, { color: colors.buttonText }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    padding: 6,
    borderRadius: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
  },
  email: {
    fontSize: 16,
    marginTop: 5,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  phoneIcon: {
    marginRight: 8,
  },
  phoneText: {
    fontSize: 16,
  },
  phoneEditContainer: {
    flex: 1,
    marginLeft: 8,
  },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  phoneButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  phoneButton: {
    padding: 8,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  phoneButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  editIcon: {
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  starRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#f0f0f0',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 15,
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    marginTop: 12,
    padding: 14,
    marginBottom: 25,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontWeight: '600',
    fontSize: 16,
  },
});