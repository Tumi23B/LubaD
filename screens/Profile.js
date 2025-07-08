import React, { useEffect, useState, useContext } from 'react'; // Import useContext
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
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
} from 'firebase/auth';
import { ref, get, update, remove } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../ThemeContext'; // Import ThemeContext

export default function Profile() {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme and colors

  const [profile, setProfile] = useState({ name: '', email: '' });
  const [image, setImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation();

  // Fetch user profile data from Firebase when the component mounts
    useEffect(() => {
  const user = auth.currentUser;
  if (user) {
    const userRef = ref(database, 'users/' + user.uid);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setProfile({
          name: data.username || '',
          email: user.email || '',
        });

        if (data.imageUrl) {
          setImage(data.imageUrl); // Set Cloudinary image from Firebase
        }
      }
    });
  }
}, []);


    // function to allow users to select an image from their device
    const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const imageUrl = await uploadToCloudinary(uri); // Upload to Cloudinary
      setImage(imageUrl); // Set in state immediately

      const user = auth.currentUser;
      const userRef = ref(database, 'users/' + user.uid);
      await update(userRef, { imageUrl }); //  Save to Firebase
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

  // utility function to upload the selected image from the user's device
  const uploadToCloudinary = async (uri) => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  });
  formData.append('upload_preset', 'driver profile images'); // unsigned preset
  formData.append('cloud_name', 'dvxycdr6l');        // Cloudinary cloud name

  const response = await fetch('https://api.cloudinary.com/v1_1/dvxycdr6l/image/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.secure_url; // This is what you'll store in Firebase
};

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.iconRed }]}>Your Profile</Text>

      <View style={styles.center}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
          <Image
            source={image ? { uri: image } : require('../assets/icon.jpeg')}
            style={[styles.avatar, { backgroundColor: colors.borderColor }]} // You might want a subtle background for avatar
          />
          <View style={[styles.cameraIcon, { backgroundColor: colors.iconRed }]}>
            <Ionicons name="camera" size={20} color={colors.buttonText} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: colors.iconRed }]}>{profile.name}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{profile.email}</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons key={i} name="star" size={20} color={colors.borderColor} /> /* Assuming borderColor for golden star color */
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.label, { color: colors.iconRed }]}>Change Password</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background, // Input background usually matches main background or card background
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

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.iconRed }]} onPress={handleChangePassword}>
          <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Update Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.borderColor }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.background} />
          <Text style={[styles.logoutText, { color: colors.background }]}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.iconRed }]} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={18} color={colors.buttonText} />
          <Text style={[styles.logoutText, { color: colors.buttonText }]}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  center: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    padding: 6,
    borderRadius: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  card: {
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2, // Android shadow
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    marginTop: 6,
    padding: 10,
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 18,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontWeight: '600',
    fontSize: 15,
  },
});