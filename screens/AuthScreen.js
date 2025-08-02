import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard, LayoutAnimation,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { auth, database } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
  const [role, setRole] = useState('customer'); 

  useEffect(() => {
    if (showLogin) setIsLogin(true);
  }, [showLogin]);

  const validateSAPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (/^0\d{9}$/.test(cleaned)) return true;
    if (/^(\+?27|0)\d{9}$/.test(cleaned)) return true;
    return false;
  };

  const formatPhoneNumberForDisplay = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('27')) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    }

    return phone;
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

  // Validate email
  if (!trimmedEmail) {
    setErrors({ ...errors, email: 'Email is required to reset password.' });
    return;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    setErrors({ ...errors, email: 'Please enter a valid email address.' });
    return;
  }

  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
    
    // Show success message
    Alert.alert(
      'Password Reset Email Sent',
      'Please check your email inbox (and spam folder) for instructions to reset your password.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Clear the email field after successful submission
            setEmail('');
            setErrors({ ...errors, email: '' });
          }
        }
      ]
    );
  } catch (error) {
    console.error('Password reset error:', error);
    
    // Handle specific Firebase errors
    let errorMessage = 'Failed to send password reset email. Please try again.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'The email address is invalid.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many requests. Please try again later.';
        break;
    }
    
    setFirebaseError(errorMessage);
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

      // Redirect based on user role
      if (userData?.role === 'driver') {
        navigation.navigate('DriverDashboard', {
          userId: userCredential.user.uid,
          username: userData.username || 'Driver',
          email: trimmedEmail,
          phoneNumber: userData.phoneNumber || '',
        });
      } else {
        navigation.navigate('Dashboard', {
          userId: userCredential.user.uid,
          username: userData?.username || 'User',
          email: trimmedEmail,
          phoneNumber: userData?.phoneNumber || '',
          formattedPhoneNumber: formatPhoneNumberForDisplay(userData?.phoneNumber || ''),
        });
      }
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const userId = userCredential.user.uid;

      // Store general user info
      await set(ref(database, 'users/' + userId), {
        username,
        email: trimmedEmail,
        phoneNumber: cleanedPhone,
        role,
        driverApplication: { status: 'not_applied' },
      });

      // ✅ Create driverApplications node with core details
      if (role === 'driver') {
        await set(ref(database, 'driverApplications/' + userId), {
          fullName: username,
          email: trimmedEmail,
          phoneNumber: cleanedPhone,
          status: 'Pending',
          createdAt: Date.now()
        });

        navigation.navigate('DriverApplication', {
          userId,
          username,
          email: trimmedEmail,
          phoneNumber: cleanedPhone,
        });
      } else {
        navigation.navigate('Dashboard', {
          userId,
          username,
          email: trimmedEmail,
          phoneNumber: cleanedPhone,
          formattedPhoneNumber: formatPhoneNumberForDisplay(cleanedPhone),
        });
      }

      setSuccessMsg('Successfully Signed Up!');
    }
  } catch (error) {
    if (error.code === 'user-not-found' || error.code === 'invalid-credential') {
      setFirebaseError('No account found for this email or password. Please sign up first.');
    } else {
      setFirebaseError(error.message);
    }
  }
};


  // Listen for keyboard hide event to force layout update
  useEffect(() => {
  const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, 50);
  });

  return () => {
    keyboardHideListener.remove();
  };
}, []);

  // Render the AuthScreen component
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        { flexGrow: 1, paddingVertical: 24 },
        { backgroundColor: colors.background },
      ]}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.logo, { color: colors.iconRed }]}>Luba Delivery</Text>
        <Text style={styles.tagline}>Your Logistics Partner</Text>
        <Image
          source={isDarkMode ? require('../assets/logo-dark-mode.png') : require('../assets/logotransparent.png')}
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

        {isLogin && (
          <Text style={[styles.infoMsg, { color: colors.text }]}> First time here? Sign Up to Login </Text>
        )}

        {!isLogin && (
          <>
            <Text style={[{ color: colors.text, marginBottom: 10, fontWeight: '600', textAlign: 'center' }]}>Register As</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
              <TouchableOpacity
                onPress={() => setRole('customer')}
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: role === 'customer' ? '#b48811' : colors.cardBackground,
                    borderColor: role === 'customer' ? '#b48811' : colors.borderColor,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={30}
                  color={role === 'customer' ? '#fff' : colors.text}
                  style={{ marginBottom: 5 }}
                />
                <Text style={{ color: role === 'customer' ? '#fff' : colors.text }}>CUSTOMER</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('driver')}
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: role === 'driver' ? '#b48811' : colors.cardBackground,
                    borderColor: role === 'driver' ? '#b48811' : colors.borderColor,
                    marginLeft: 20,
                  },
                ]}
              >
                <Ionicons
                  name="car-outline"
                  size={30}
                  color={role === 'driver' ? '#fff' : colors.text}
                  style={{ marginBottom: 5 }}
                />
                <Text style={{ color: role === 'driver' ? '#fff' : colors.text }}>DRIVER</Text>
              </TouchableOpacity>
            </View>

{/**input field for username */}

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
          </>
        )}

{/**input field for email */}

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

{/**input field for phone number */}

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

{/**input field for password */}

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

{/**input field for confirm password */}

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
  <TouchableOpacity 
    onPress={handleForgotPassword}
    style={styles.forgotPasswordButton}
  >
    <Text style={[styles.forgotPassword, { color: colors.iconRed }]}>
      Forgot Password?
    </Text>
  </TouchableOpacity>
)}

        {firebaseError ? <Text style={[styles.error, { color: colors.iconRed }]}>{firebaseError}</Text> : null}
        {successMsg ? <Text style={[styles.successMsg, { color: 'green' }]}>{successMsg}</Text> : null}

        <TouchableOpacity onPress={handleAuth} activeOpacity={0.85}>
          <LinearGradient colors={['#ebd197', '#b48811', '#a2790d', '#bb9b49']} style={styles.authButton}>
            <Text style={styles.authButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
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
  forgotPasswordButton: {
  alignSelf: 'flex-end',
  marginBottom: 15,
},
forgotPassword: {
  fontSize: 14,
  fontWeight: '500',
},
  roleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
});
