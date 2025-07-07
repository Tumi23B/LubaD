import React, { useState, useContext } from 'react'; // Import useContext
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../firebase';
import { ref, push } from 'firebase/database';
import { ThemeContext } from '../ThemeContext'; // Import ThemeContext

export default function Feedback() {
  const { isDarkMode, colors } = useContext(ThemeContext); // Use useContext to get theme and colors

  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Feedback Required", "Please write your feedback before submitting.");
      return;
    }

    try {
      const feedbackRef = ref(database, 'feedbacks/');
      await push(feedbackRef, {
        message,
        contact,
        timestamp: new Date().toISOString(),
      });

      Alert.alert("Thank You!", "Your feedback has been submitted.");
      setMessage('');
      setContact('');
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Try again later.");
      console.error("Firebase write error:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }} // Apply background color here
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.iconRed }]}>We Value Your Feedback</Text> {/* Apply text color */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Let us know how we can improve your experience.</Text> {/* Apply text color */}

        <Text style={[styles.label, { color: colors.iconRed }]}>Your Feedback</Text> {/* Apply label text color */}
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.cardBackground, // Input background
              borderColor: colors.borderColor, // Input border
              color: colors.text, // Input text color
            },
          ]}
          multiline
          numberOfLines={6}
          placeholder="Write your feedback here..."
          placeholderTextColor={colors.textSecondary} // Placeholder text color
          value={message}
          onChangeText={setMessage}
        />

        <Text style={[styles.label, { color: colors.iconRed }]}>Your Email or Phone (optional)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.cardBackground, // Input background
              borderColor: colors.borderColor, // Input border
              color: colors.text, // Input text color
            },
          ]}
          placeholder="example@gmail.com or 0723456789"
          placeholderTextColor={colors.textSecondary} // Placeholder text color
          value={contact}
          onChangeText={setContact}
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.iconRed }]} onPress={handleSubmit}>
          <Ionicons name="send" size={20} color={colors.buttonText} /> {/* Apply icon color */}
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Submit Feedback</Text> {/* Apply button text color */}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  button: {
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});