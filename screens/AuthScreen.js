import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { auth, database } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';

// AuthScreen handles both Login and Sign Up logic and interface
export default function AuthScreen() {
  // State variables for form fields and error messages
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Sign Up
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({}); // Field validation errors
  const [firebaseError, setFirebaseError] = useState(''); // Firebase error messages
  const [successMsg, setSuccessMsg] = useState(''); // Success message for sign up

  // Validate user input for each field
  const validate = () => {
    let valid = true;
    let errs = {};
    // Username validation (Sign Up only)
    if (!isLogin) {
      if (!username || username.length < 6) {
        errs.username = 'Username must be at least 6 characters.';
        valid = false;
      } else if (username.includes('@')) {
        errs.username = 'Username must not be an email.';
        valid = false;
      }
    }
    // Email validation
    if (!email) {
      errs.email = 'Email is required.';
      valid = false;
    } else if (email !== email.toLowerCase() || !email.includes('@')) {
      errs.email = 'Email must be lowercase and contain @.';
      valid = false;
    }
    // Password validation
    if (!password) {
      errs.password = 'Password is required.';
      valid = false;
    } else if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[#_!]/.test(password)
    ) {
      errs.password = 'Password must be at least 8 characters and include upper, lower, number, and one of: _ # !';
      valid = false;
    }
    // Confirm password (Sign Up only)
    if (!isLogin && password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
      valid = false;
    }
    setErrors(errs);
    return valid;
  };

  // Handle Login or Sign Up button press
  const handleAuth = async () => {
    setFirebaseError('');
    setSuccessMsg('');
    if (!validate()) return; // Stop if validation fails
    if (isLogin) {
      // Login logic using Firebase Authentication
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Success: navigate to app home or show success message
      } catch (error) {
        // Check for user-not-found error and show a friendly message
        if (error.code === 'auth/user-not-found') {
          setFirebaseError('No account found for this email. Please sign up first.');
        } else {
          setFirebaseError(error.message); // Show other Firebase errors
        }
      }
    } else {
      // Sign Up logic: create user and store username/email in database
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        // Store username and email in Realtime Database (never store password)
        await set(ref(database, 'users/' + userId), {
          username: username,
          email: email
        });
        setSuccessMsg('Successfully Signed Up!'); // Show success message
        // Success: navigate to app home or show success message
      } catch (error) {
        setFirebaseError(error.message); // Show Firebase error
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
          {/* App Logo and Tagline */}
          <Text style={styles.logo}>Luba Delivery</Text>
          <Text style={styles.tagline}>Your Logistics Partner</Text>

          {/* Tab Switcher for Login/Sign Up */}
          <View style={styles.tab}>
            <TouchableOpacity
              style={[styles.tabButton, isLogin && styles.activeTab]}
              onPress={() => { setIsLogin(true); setErrors({}); setFirebaseError(''); }}
            >
              <Text style={[styles.tabText, isLogin && styles.activeText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, !isLogin && styles.activeTab]}
              onPress={() => { setIsLogin(false); setErrors({}); setFirebaseError(''); }}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Show static sign up prompt on Login screen */}
          {isLogin && (
            <Text style={styles.infoMsg}> First time here? Sign Up To Login</Text>
          )}

          {/* Username field (Sign Up only) */}
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

          {/* Email field */}
          <View style={styles.field}>
            <TextInput
              placeholder="📧 Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}
          </View>

          {/* Password field */}
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

          {/* Confirm Password field (Sign Up only) */}
          {!isLogin && (
            <View style={styles.field}>
              <TextInput
                placeholder="🔒 Confirm Password"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
            </View>
          )}

          {/* Show Firebase or validation errors */}
          {firebaseError ? <Text style={styles.error}>{firebaseError}</Text> : null}

          {/* Show success message on Sign Up */}
          {!isLogin && successMsg ? (
            <Text style={styles.successMsg}>{successMsg}</Text>
          ) : null}

          {/* Login or Sign Up button */}
          <Button
            title={isLogin ? 'Login' : 'Sign Up'}
            color="#D90D32"
            onPress={handleAuth}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles for the AuthScreen UI
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
    marginBottom: 15, // space between form groups
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
