import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Button, Text, View, StyleSheet, TouchableOpacity , Image} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native'; // <-- import StripeProvider
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
    <StripeProvider publishableKey="pk_test_YourPublishableKeyHere">  {/* <-- add your Stripe publishable key */}
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen}
            options={{ headerShown: false, title: 'Home' }} />
          <Stack.Screen name="Auth" component={AuthScreen}
            options={{ headerShown: false, title: 'Auth Screen' }} />
          <Stack.Screen name="Dashboard" component={Dashboard} /> 
          <Stack.Screen name="DriverApplication" component={DriverApplication} 
            options={{ headerShown: false, title: 'Driver Application' }} />
          <Stack.Screen name="DriverDashboard" component={DriverDashboard} 
            options={{ headerShown: false, title: 'Dashboard' }}/>
          <Stack.Screen name="Checkout" component={Checkout} 
            options={{ headerShown:false, title: 'Checkout' }}/>
          <Stack.Screen name="Payment" component={Payment} 
            options={{ headerShown:false, title: 'Payment' }}/>
            <Stack.Screen name="Settings" component={Settings}
            options={{ headerShown:false, title:'Settings' }} />

            <Stack.Screen name="Profile" component={Profile}
            options={{ headerShown:false, title:'Profile' }} />

            <Stack.Screen name="Notifications" component={Notifications}
            options={{ headerShown:false, title: 'Notifications'}}/>

             <Stack.Screen name="AppThemeScreen" component={AppThemeScreen}
            options={{ headerShown:false, title: 'App Theme'}}/>

             <Stack.Screen name="HelpCenter" component={HelpCenter}
            options={{ headerShown:false, title: 'Help Center'}}/>

             <Stack.Screen name="Feedback" component={Feedback}
            options={{ headerShown:false, title: 'Feedback'}}/>
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy}
            options={{ headerShown:false, title: 'Privacy Policy'}}/>


            <Stack.Screen name="Terms" component={TermsOfService}
            options={{ headerShown:false, title: 'Terms Of Service'}}/>
            <Stack.Screen name="BookingHistory" component={BookingHistory}
            options={{ headerShown:false, title:'Booking History'}}/>

            <Stack.Screen name="ChatScreen" component={ChatScreen}
            options={{ headerShown:false, title:'Chat'}}/>


            <Stack.Screen name="DriverProfile" component={DriverProfile}
            options={{ headerShown:false, title:'Driver Profile'}}/>


            <Stack.Screen name="DriverChat" component={DriverChat}
            options={{ headerShown:false, title:' Driver Chat'}}/>
            
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </StripeProvider>
  );
}

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome To Luba Delivery!</Text>

      <Image
        source={require('./assets/logotransparent.png')} // adjust the path to your actual logo location
        style={styles.logoImg}
        resizeMode="contain"
      />

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Auth')}>
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles Sheet
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b80000', //'#FFFAF1'
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
// logo image style
  logoImg: {
  width: 200,
  height: 200,
  marginVertical: 15,
  },

  title: {
    fontSize: 22,
    marginBottom: 20,
    marginTop:30,
    fontWeight: 'bold',
    color: '#b80000', 
  },
  button: {
    backgroundColor: '#c5a34f', // Red background
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: '#f0f0f0', // Gold text
    fontWeight: 'bold',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
});
