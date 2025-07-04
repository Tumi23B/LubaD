import React, { useEffect, useState } from 'react';
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

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [image, setImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        }
      });
    }
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
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
    try {
      await signOut(auth);
      Alert.alert('Logged out', 'You have been signed out.');
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
              await update(ref(database, 'users/' + user.uid), { active: false });
              await signOut(auth);
              Alert.alert('Deactivated', 'Your account is now inactive.');
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
              await remove(ref(database, 'users/' + user.uid));
              await deleteUser(user);
              Alert.alert('Deleted', 'Your account has been removed.');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Your Profile</Text>

      <View style={styles.center}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
          <Image
            source={image ? { uri: image } : require('../assets/icon.jpeg')}
            style={styles.avatar}
          />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons key={i} name="star" size={20} color="#f4c430" />
          ))}
        </View>
      </View>

      <View style={styles.card}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#b80000',
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
    backgroundColor: '#ccc',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#b80000',
    padding: 6,
    borderRadius: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#b80000',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    color: '#b80000',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#b80000',
    padding: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    backgroundColor: '#c5a34f',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  deactivateButton: {
    marginTop: 12,
    backgroundColor: '#e08900',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: '#b80000',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
