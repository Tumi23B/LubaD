import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
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
      errs.password = 'Password must be 8+ chars, include upper, lower, number, and special (#_!).';
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

  // Handle Login button press
  const handleAuth = async () => {
    setFirebaseError('');
    if (!validate()) return; // Stop if validation fails
    if (isLogin) {
      // Login logic using Firebase Authentication
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Success: navigate to app home or show success message
      } catch (error) {
        setFirebaseError(error.message); // Show Firebase error
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
        // Success: navigate to app home or show success message
      } catch (error) {
        setFirebaseError(error.message); // Show Firebase error
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* App Logo and Tagline */}
      <Text style={styles.logo}>Luba Delivery </Text>
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

      {/* Username field (Sign Up only) */}
      {!isLogin && (
        <View>
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
      <View>
        <TextInput
          placeholder="📧 Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}
      </View>
      <View>
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
        <View>
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

      {/* Login or Sign Up button */}
      <Button
        title={isLogin ? 'Login' : 'Sign Up'}
        color="#D90D32"
        onPress={handleAuth}
      />
    </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
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
  error: {
    color: 'red',
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
  },
});
