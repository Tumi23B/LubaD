import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import Dashboard from './screens/Dashboard';
import AuthScreen from './screens/AuthScreen';
import DriverApplication from './screens/DriverApplication'; 
import DriverDashboard from './screens/DriverDashboard';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} /> 
        <Stack.Screen name="DriverApplication" component={DriverApplication} 
        options={{ headerShown: true, title: 'Driver Application' }} />
      
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome To Luba Delivery!</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Auth')}>
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', //'#FFFAF1'
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#b80000', // Red text
  },
  button: {
  backgroundColor: '#b80000', // Red background
  paddingVertical: 12,
  paddingHorizontal: 25,
  borderRadius: 8,
},
buttonText: {
  color: '#c5a34f', // Gold text
  fontWeight: 'bold',
  fontSize: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 1,
},

});
