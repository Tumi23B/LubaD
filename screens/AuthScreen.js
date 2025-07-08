import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import { auth, database } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../ThemeContext';

const lightModeLogo = require('../assets/logotransparent.png');
const darkModeLogo = require('../assets/logo-dark-mode.png');

export default function AuthScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode, colors } = useContext(ThemeContext);

  const showLogin = route.params?.showLogin ?? false;
  const [isLogin, setIsLogin] = useState(showLogin);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [firebaseError, setFirebaseError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (showLogin) setIsLogin(true);
  }, [showLogin]);

  // Validate South African phone number
  const validateSAPhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it starts with 0 and has 10 digits (e.g., 0821234567)
    if (/^0\d{9}$/.test(cleaned)) return true;
    
    // Check if it starts with +27 or 27 and has 11 digits (e.g., +27821234567 or 27821234567)
    if (/^(\+?27|0)\d{9}$/.test(cleaned)) return true;
    
    return false;
  };

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

      if (!phoneNumber) {
        errs.phoneNumber = 'Phone number is required.';
        valid = false;
      } else if (!validateSAPhoneNumber(phoneNumber)) {
        errs.phoneNumber = 'Enter a valid South African phone number (e.g., 0821234567 or +27821234567)';
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

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      setErrors({...errors, email: 'Email is required to reset password.'});
      return;
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email to reset your password.'
      );
    } catch (error) {
      setFirebaseError(error.message);
    }
  };

  const handleAuth = async () => {
    setFirebaseError('');
    setSuccessMsg('');
    if (!validate()) return;

    const trimmedEmail = email.trim().toLowerCase();
    const cleanedPhone = phoneNumber.replace(/\D/g, '');

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
          phoneNumber: cleanedPhone,
          role: 'customer',
          driverApplication: { status: 'not_applied' },
        });

        setSuccessMsg('Successfully Signed Up!');
        navigation.navigate('Dashboard', { username });
      }
    } catch (error) {
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential'
      ) {
        setFirebaseError('No account found for this email or password. Please sign up first.');
      } else {
        setFirebaseError(error.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={40}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          { flexGrow: 1, paddingVertical: 24 },
          { backgroundColor: colors.background }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.logo, { color: colors.iconRed }]}>Luba Delivery</Text>
          <Text style={[styles.tagline]}>Your Logistics Partner</Text>

          <Image
            source={isDarkMode ? darkModeLogo : lightModeLogo}
            style={styles.logoImg}
            resizeMode="contain"
          />

          <View style={styles.tab}>
            <TouchableOpacity onPress={() => { setIsLogin(true); setErrors({}); setFirebaseError(''); }}>
              <LinearGradient
                colors={isLogin ? ['#7B0000', '#990000', '#B30000', '#CC0000', '#E60000'] : [colors.background, colors.background]}
                style={styles.gradientTab}
              >
                <Text style={[styles.tabText, isLogin ? styles.activeText : { color: colors.text }]}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setIsLogin(false); setErrors({}); setFirebaseError(''); }}>
              <LinearGradient
                colors={!isLogin ? ['#7B0000', '#990000', '#B30000', '#CC0000', '#E60000'] : [colors.background, colors.background]}
                style={styles.gradientTab}
              >
                <Text style={[styles.tabText, !isLogin ? styles.activeText : { color: colors.text }]}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {isLogin && <Text style={[styles.infoMsg, { color: colors.text }]}>First time here? Sign Up to Login</Text>}

          {!isLogin && (
            <View style={styles.field}>
              <TextInput
                placeholder="👤 Username"
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.borderColor }]}
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              {errors.username && <Text style={[styles.error, { color: colors.iconRed }]}>{errors.username}</Text>}
            </View>
          )}

          <View style={styles.field}>
            <TextInput
              placeholder="📧 Email"
              style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.borderColor }]}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email && <Text style={[styles.error, { color: colors.iconRed }]}>{errors.email}</Text>}
          </View>

          {!isLogin && (
            <View style={styles.field}>
              <TextInput
                placeholder="📱 South African Phone (e.g.0821234567)"
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.borderColor }]}
                placeholderTextColor={colors.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && <Text style={[styles.error, { color: colors.iconRed }]}>{errors.phoneNumber}</Text>}
            </View>
          )}

          <View style={styles.field}>
            <TextInput
              placeholder="🔒 Password"
              secureTextEntry
              style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.borderColor }]}
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
            />
            {errors.password && <Text style={[styles.error, { color: colors.iconRed }]}>{errors.password}</Text>}
          </View>

          {!isLogin && (
            <View style={styles.field}>
              <TextInput
                placeholder="🔒 Confirm Password"
                secureTextEntry
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.borderColor }]}
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {errors.confirmPassword && <Text style={[styles.error, { color: colors.iconRed }]}>{errors.confirmPassword}</Text>}
            </View>
          )}

          {isLogin && (
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={[styles.forgotPassword, { color: colors.iconRed }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {firebaseError ? <Text style={[styles.error, { color: colors.iconRed }]}>{firebaseError}</Text> : null}
          {successMsg ? <Text style={[styles.successMsg, { color: 'green' }]}>{successMsg}</Text> : null}

          <TouchableOpacity onPress={handleAuth} activeOpacity={0.85}>
            <LinearGradient
              colors={['#ebd197', '#b48811', '#a2790d', '#bb9b49']}
              style={styles.authButton}
            >
              <Text style={styles.authButtonText}>
                {isLogin ? 'Login' : 'Sign Up'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flex: 1,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabText: {
    fontWeight: '500',
    fontSize: 16,
  },
  activeText: {
    color: '#f0f0f0',
    fontWeight: 'bold',
  },
  field: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  logoImg: {
    width: 160,
    height: 160,
    marginVertical: 8,
    alignSelf: 'center',
  },
  error: {
    fontSize: 10,
    marginTop: 4,
    marginLeft: 4,
  },
  infoMsg: {
    fontSize: 12,
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
  authButton: {
    width: 180,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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
  forgotPassword: {
    textAlign: 'right',
    marginBottom: 15,
    fontSize: 12,
  },
});