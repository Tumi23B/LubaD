import { StatusBar } from 'expo-status-bar';
import React, { useContext } from 'react'; // Import useContext
import { Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ThemeProvider, ThemeContext } from './ThemeContext'; // Import ThemeContext here

// This is the main entry point of the app, wrapping everything in the ThemeProvider

// Screens
import Dashboard from './screens/Dashboard';
import AuthScreen from './screens/AuthScreen';
import DriverApplication from './screens/DriverApplication';
import DriverDashboard from './screens/DriverDashboard';
import Checkout from './screens/Checkout';
import Payment from './screens/Payment';
import Settings from './screens/Settings';
import Profile from './screens/Profile';
import Notifications from './screens/Notifications';
import AppThemeScreen from './screens/AppThemeScreen';
import HelpCenter from './screens/HelpCenter';
import Feedback from './screens/Feedback';
import PrivacyPolicy from './screens/PrivacyPolicy';
import TermsOfService from './screens/TermsOfService';
import BookingHistory from './screens/BookingHistory';
import ChatScreen from './screens/ChatScreen';
import DriverProfile from './screens/DriverProfile';
import DriverChat from './screens/DriverChat';

const Stack = createNativeStackNavigator();

// Import both light and dark mode logo images for HomeScreen
const lightModeHomeLogo = require('./assets/logotransparent.png');
const darkModeHomeLogo = require('./assets/logo-dark-mode.png'); // Assuming this is your dark mode logo

export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_YourPublishableKeyHere">
      <ThemeProvider> {/* <-- Theme wrapper here */}
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false, title: 'Home' }}
            />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }}/>
            <Stack.Screen name="DriverApplication" component={DriverApplication} options={{ headerShown: false }} />
            <Stack.Screen name="DriverDashboard" component={DriverDashboard} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={Checkout} options={{ headerShown: false }} />
            <Stack.Screen name="Payment" component={Payment} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} />
            <Stack.Screen name="AppThemeScreen" component={AppThemeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="HelpCenter" component={HelpCenter} options={{ headerShown: false }} />
            <Stack.Screen name="Feedback" component={Feedback} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} options={{ headerShown: false }} />
            <Stack.Screen name="Terms" component={TermsOfService} options={{ headerShown: false }} />
            <Stack.Screen name="BookingHistory" component={BookingHistory} options={{ headerShown: false }} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DriverProfile" component={DriverProfile} options={{ headerShown: false }} />
            <Stack.Screen name="DriverChat" component={DriverChat} options={{ headerShown: false }} />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </ThemeProvider>
    </StripeProvider>
  );
}

function HomeScreen({ navigation }) {
  // Use useContext to get the current theme colors and isDarkMode status
  const { isDarkMode, colors } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: colors.iconRed }]}> {/* Apply background color */}
      <Text style={[styles.title, { color: colors.tagline }]}>Welcome To Luba Delivery!</Text> {/* Apply text color */}
      <Text style={styles.tagline}>Your Logistics Partner</Text> {/* Apply secondary text color */}

      {/* Conditional Logo Image based on theme */}
      <Image
        source={isDarkMode ? darkModeHomeLogo : lightModeHomeLogo}
        style={styles.logoImg}
        resizeMode="contain"
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.tagline}]} onPress={() => navigation.navigate('Auth')}>
        <Text style={[styles.buttonText]}>GET STARTED</Text> {/* Apply button text color */}
      </TouchableOpacity>
    </View>
  );
}

// Styles
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  logoImg: {
    width: 200,
    height: 200,
    marginVertical: 15,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    marginTop: 30,
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    color: '#f0f0f0',
  },
    tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
});
