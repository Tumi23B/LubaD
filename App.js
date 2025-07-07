import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ThemeProvider } from './ThemeContext'; // <-- Theme context provider

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
            <Stack.Screen name="Dashboard" component={Dashboard} />
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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome To Luba Delivery!</Text>
      <Image
        source={require('./assets/logotransparent.png')}
        style={styles.logoImg}
        resizeMode="contain"
      />
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Auth')}>
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b80000',
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
    color: '#b80000',
  },
  button: {
    backgroundColor: '#c5a34f',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
});
