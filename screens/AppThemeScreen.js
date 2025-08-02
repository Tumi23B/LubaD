import React, { useContext, useState, useRef, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ThemeContext } from '../ThemeContext';
import { LogBox } from 'react-native';

// Ignore specific warning messages
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
  'expo-notifications: Android Push notifications',
  'expo-av: Expo AV has been deprecated',
]);

{/*Or ignore all logs (not recommended unless you're demoing)
LogBox.ignoreAllLogs(true);*/}

export default function AppThemeScreen() {
  const { isDarkMode, toggleTheme, colors } = useContext(ThemeContext);
  const themeName = isDarkMode ? "Dark" : "Light";

  const [saveConfirmation, setSaveConfirmation] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleSave = () => {
    setSaveConfirmation("Theme saved!");
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
     
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setSaveConfirmation(""));
      }, 2000);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.iconRed }]}>
        Choose Your App Theme
      </Text>

      <View style={styles.themeOption}>
        <Text style={[styles.optionText, { color: colors.text }]}>
          {themeName} Mode
        </Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          thumbColor={isDarkMode ? colors.buttonText : colors.iconRed}
          trackColor={{ false: colors.borderColor, true: colors.iconRed }}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.iconRed }]}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Save Theme</Text>
      </TouchableOpacity>

      {saveConfirmation ? (
        <Animated.View style={[styles.confirmationWrapper, { opacity: fadeAnim }]}>
          <Text style={[styles.confirmationText, { color: colors.text }]}>
            {saveConfirmation}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  optionText: {
    fontSize: 18,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationWrapper: {
    alignItems: 'center',
    marginTop: 16,
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
