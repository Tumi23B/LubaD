import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../firebase';
import { ref, push } from 'firebase/database';
import { ThemeContext } from '../ThemeContext';
import { LogBox } from 'react-native';

// Ignore specific warning messages
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

{/*Or ignore all logs (not recommended unless you're demoing)
LogBox.ignoreAllLogs(true);*/}

export default function Feedback() {
  const { colors } = useContext(ThemeContext);

  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Feedback Required', 'Please write your feedback before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const feedbackRef = ref(database, 'feedbacks/');
      await push(feedbackRef, {
        message,
        contact,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('Thank You!', 'Your feedback has been submitted.');
      setMessage('');
      setContact('');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Try again later.');
      console.error('Firebase write error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardAvoidingView, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.iconRed }]}>We Value Your Feedback</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Let us know how we can improve your experience.
        </Text>

        <Text style={[styles.label, { color: colors.iconRed }]}>Your Feedback</Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.borderColor,
              color: colors.text,
            },
          ]}
          multiline
          numberOfLines={6}
          placeholder="Write your feedback here..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          editable={!submitting}
        />

        <Text style={[styles.label, { color: colors.iconRed }]}>Your Email or Phone (optional)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.borderColor,
              color: colors.text,
            },
          ]}
          placeholder="example@gmail.com or 0723456789"
          placeholderTextColor={colors.textSecondary}
          value={contact}
          onChangeText={setContact}
          editable={!submitting}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.iconRed }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={20} color={colors.buttonText} />
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
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
