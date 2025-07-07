import React, { useState, useContext } from 'react'; // Import useContext
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { ThemeContext } from '../ThemeContext'; // Import ThemeContext

export default function Payment({ route, navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme and colors

  const { vehicle, pickup, dropoff, date, helpWithLoading } = route.params;

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);

  const methods = ['Cash', 'Card', 'Apple Pay'];

  const handlePayPress = () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose how you want to pay.');
      return;
    }

    Alert.alert('Payment Successful', `You selected ${selectedMethod}.`);
    setPaymentDone(true);
  };

  const handleChatPress = () => {
    navigation.navigate('ChatScreen', {
      bookingId: 'ABC123',
      driverName: 'John Doe',
      driverPhone: '+1234567890',
    });
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}> {/* Apply background color */}
      {!paymentDone ? (
        <>
          <Text style={[styles.title, { color: colors.iconRed }]}>Choose Payment Method</Text> {/* Apply text color */}
          {methods.map((method, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.methodButton,
                {
                  backgroundColor: colors.cardBackground, // Method button background
                  borderColor: selectedMethod === method ? colors.iconRed : colors.borderColor, // Border based on selection
                },
              ]}
              onPress={() => setSelectedMethod(method)}
            >
              <Text
                style={[
                  styles.methodText,
                  {
                    color: selectedMethod === method ? colors.iconRed : colors.text, // Text color based on selection
                  },
                ]}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.iconRed }]} onPress={handlePayPress}>
            <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>Pay Now</Text> {/* Apply button text color */}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.iconRed }]}>Booking Summary</Text>

          <View style={[styles.infoBox, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}> {/* Apply background and border color */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Pickup Location:</Text> {/* Apply label text color */}
            <Text style={[styles.value, { color: colors.text }]}>{pickup}</Text> {/* Apply value text color */}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Dropoff Location:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{dropoff}</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Date & Time:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{new Date(date).toLocaleString()}</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Vehicle Selected:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{vehicle || 'N/A'}</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Method:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{selectedMethod}</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Assistance Needed:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {helpWithLoading ? 'Yes, help with loading/unloading' : 'No'}
            </Text>
          </View>

          <TouchableOpacity style={[styles.chatButton, { backgroundColor: colors.iconRed }]} onPress={handleChatPress}>
            <Text style={[styles.chatButtonText, { color: colors.buttonText }]}>Chat with Driver</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'center',
  },
  methodButton: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  methodText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  confirmButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  infoBox: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
  },
  label: {
    fontWeight: '600',
    marginTop: 10,
  },
  value: {
    marginTop: 4,
  },
  chatButton: {
    padding: 14,
    borderRadius: 10,
    marginTop: 30,
  },
  chatButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
});