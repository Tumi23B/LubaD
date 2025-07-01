import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Luba Delivery </Text>
      <Text style={styles.tagline}>Your Logistics Partner</Text>

      <View style={styles.tab}>
        <TouchableOpacity
          style={[styles.tabButton, isLogin && styles.activeTab]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.tabText, isLogin && styles.activeText]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, !isLogin && styles.activeTab]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.tabText, !isLogin && styles.activeText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {!isLogin && (
        <TextInput
          placeholder="👤 Username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
      )}

      <TextInput
        placeholder="📧 Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="🔒 Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      {!isLogin && (
        <TextInput
          placeholder="🔒 Confirm Password"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      )}

      <Button
        title={isLogin ? 'Login' : 'Sign Up'}
        color="#D90D32"
        onPress={() => {
          //  Firebase logic 
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D90D32',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  tab: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  tabText: {
    fontWeight: '500',
    color: '#333',
  },
  activeTab: {
    backgroundColor: '#FFD700',
  },
  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
