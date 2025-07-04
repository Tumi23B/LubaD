import React, { useState } from 'react';
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

export default function Feedback() {
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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>We Value Your Feedback</Text>
        <Text style={styles.subtitle}>Let us know how we can improve your experience.</Text>

        <Text style={styles.label}>Your Feedback</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          placeholder="Write your feedback here..."
          placeholderTextColor="#888"
          value={message}
          onChangeText={setMessage}
        />

        <Text style={styles.label}>Your Email or Phone (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="example@gmail.com or 0723456789"
          placeholderTextColor="#888"
          value={contact}
          onChangeText={setContact}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles.buttonText}>Submit Feedback</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#b80000',
    marginBottom: 8,
    marginTop: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b80000',
    marginBottom: 6,
    marginTop: 16,
  },
  textArea: {
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#b80000',
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#c5a34f',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
