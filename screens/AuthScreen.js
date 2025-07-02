import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { auth, database } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {
  const navigation = useNavigation();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [firebaseError, setFirebaseError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const validate = () => {
    let valid = true;
    let errs = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!isLogin) {
      if (!username || username.length < 6) {
        errs.username = 'Username must be at least 6 characters.';
        valid = false;
      } else if (username.includes('@')) {
        errs.username = 'Username must not be an email.';
        valid = false;
      }
    }

    if (!trimmedEmail) {
      errs.email = 'Email is required.';
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errs.email = 'Please enter a valid email address.';
        valid = false;
      }
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!password) {
      errs.password = 'Password is required.';
      valid = false;
    } else if (!passwordRegex.test(password)) {
      errs.password =
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
      valid = false;
    }

    if (!isLogin && password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
      valid = false;
    }

    setErrors(errs);
    return valid;
  };

  const handleAuth = async () => {
    setFirebaseError('');
    setSuccessMsg('');
    if (!validate()) return;

    const trimmedEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        const snapshot = await get(ref(database, 'users/' + userCredential.user.uid));
        const userData = snapshot.val();
        const name = userData?.username || 'User';
        navigation.navigate('Dashboard', { username: name });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const userId = userCredential.user.uid;

        await set(ref(database, 'users/' + userId), {
          username,
          email: trimmedEmail,
          role: 'customer',
          driverApplication: { status: 'not_applied' },
        });

        setSuccessMsg('Successfully Signed Up!');
        navigation.navigate('Dashboard', { username });
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setFirebaseError('No account found for this email. Please sign up first.');
      } else {
        setFirebaseError(error.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.logo}>Luba Delivery</Text>
          <Text style={styles.tagline}>Your Logistics Partner</Text>

          <View style={styles.tab}>
            <TouchableOpacity
              style={[styles.tabButton, isLogin && styles.activeTab]}
              onPress={() => {
                setIsLogin(true);
                setErrors({});
                setFirebaseError('');
              }}
            >
              <Text style={[styles.tabText, isLogin && styles.activeText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, !isLogin && styles.activeTab]}
              onPress={() => {
                setIsLogin(false);
                setErrors({});
                setFirebaseError('');
              }}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {isLogin && <Text style={styles.infoMsg}>First time here? Sign Up to Login</Text>}

          {!isLogin && (
            <View style={styles.field}>
              <TextInput
                placeholder="👤 Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              {errors.username && <Text style={styles.error}>{errors.username}</Text>}
            </View>
          )}

          <View style={styles.field}>
            <TextInput
              placeholder="📧 Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}
          </View>

          <View style={styles.field}>
            <TextInput
              placeholder="🔒 Password"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            {errors.password && <Text style={styles.error}>{errors.password}</Text>}
          </View>

          {!isLogin && (
            <View style={styles.field}>
              <TextInput
                placeholder="🔒 Confirm Password"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {errors.confirmPassword && (
                <Text style={styles.error}>{errors.confirmPassword}</Text>
              )}
            </View>
          )}

          {firebaseError ? <Text style={styles.error}>{firebaseError}</Text> : null}
          {successMsg ? <Text style={styles.successMsg}>{successMsg}</Text> : null}
          <View style={{ height: 16 }} />
          <Button title={isLogin ? 'Login' : 'Sign Up'} color="#D90D32" onPress={handleAuth} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D90D32',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  tab: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  tabText: {
    fontWeight: '500',
    color: '#333',
  },
  activeTab: {
    backgroundColor: '#FFD700',
  },
  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  field: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  error: {
    color: 'red',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  infoMsg: {
    fontSize: 10,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  successMsg: {
    color: 'green',
    fontSize: 10,
    marginTop: 10,
    textAlign: 'center',
  },
});
