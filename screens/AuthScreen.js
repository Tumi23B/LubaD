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
import { auth, database } from '../firebase'; // Assuming '../firebase' exports 'auth' and 'database'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure expo-linear-gradient is installed

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
            {/* Login Tab */}
            <TouchableOpacity onPress={() => { setIsLogin(true); setErrors({}); setFirebaseError(''); }}>
              <LinearGradient
                colors={isLogin ? ['#7B0000', '#990000', '#B30000', '#CC0000', '#E60000'] : ['#f0f0f0', '#f0f0f0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientTab}
              >
                <Text style={[styles.tabText, isLogin && styles.activeText]}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Tab */}
            <TouchableOpacity onPress={() => { setIsLogin(false); setErrors({}); setFirebaseError(''); }}>
              <LinearGradient
                colors={!isLogin ? ['#7B0000', '#990000', '#B30000', '#CC0000', '#E60000'] : ['#f0f0f0', '#f0f0f0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientTab}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeText]}>Sign Up</Text>
              </LinearGradient>
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

          {/* Login or Sign Up button */}
          <TouchableOpacity onPress={handleAuth} activeOpacity={0.85}>
            <LinearGradient
              colors={['#ebd197', '#b48811', '#a2790d', '#bb9b49']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.authButton}
            >
              <Text style={styles.authButtonText}>
                {isLogin ? 'Login' : 'Sign Up'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* This button is redundant as the TouchableOpacity with LinearGradient serves the same purpose */}
          {/* <Button title={isLogin ? 'Login' : 'Sign Up'} color="#D90D32" onPress={handleAuth} /> */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#f0f0f0', // '#FFFAF1' Light background color
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#b80000',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color:'#c5a34f', // Gold color for tagline
  },
  tab: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
    backgroundColor: '#f0f0f0', //'#f3eee2'
    borderRadius: 12,
    overflow: 'hidden',
  },
  // tabButton style is no longer directly used for the main tab buttons,
  // as gradientTab is used instead. Keeping it in case it's used elsewhere.
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    shadowColor: '#000', // Tab shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontWeight: '500',
    color: '#333', // toggle button text
    fontSize: 16,
  },
  activeTab: {
    backgroundColor: '#FFD700', // This style might not be fully applied due to LinearGradient
  },
  activeText: {
    color: '#f0f0f0', // Changed to #f0f0f0 for better contrast on red gradient
    fontWeight: 'bold',
  },
  field: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c5a34f',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  error: {
    color: '#b80000',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  infoMsg: {
    fontSize: 12,
    color: '#b80000',
    textAlign: 'center',
    marginBottom: 20,
  },
  successMsg: {
    color: 'green',
    fontSize: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  gradientTab: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  //Login & Sign Up Button Style
  authButton: {
    width: 180, // Set your preferred width
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center', // Centers the button horizontally
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 16,
  },
  authButtonText: {
    color: '#f0f0f0',
    fontWeight: '500',
    fontSize: 16,
    letterSpacing: 1,
  },
});
