import React, { useContext, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../ThemeContext';

export default function AppThemeScreen() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const themeName = isDarkMode ? "Dark" : "Light";
  const [saveConfirmation, setSaveConfirmation] = useState("");

  const handleSave = () => {
    setSaveConfirmation("Theme saved!");
    setTimeout(() => setSaveConfirmation(""), 2000);
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.darkMode : styles.lightMode]}>
      <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
        Choose Your App Theme
      </Text>

      <View style={styles.themeOption}>
        <Text style={[styles.optionText, isDarkMode ? styles.darkText : styles.lightText]}>
          {themeName} Mode
        </Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          thumbColor={isDarkMode ? "#fff" : "#b80000"}
          trackColor={{ false: "#ccc", true: "#b80000" }}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isDarkMode ? styles.darkButton : styles.lightButton]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save Theme</Text>
      </TouchableOpacity>

      {saveConfirmation ? (
      <View style={styles.confirmationWrapper}>
        <Text style={[styles.confirmationText, isDarkMode ? styles.darkText : styles.lightText]}>
          {saveConfirmation}
        </Text>
      </View>
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
    color: '#b80000',
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  optionText: {
    fontSize: 18,
    color: '#b80000',
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c5a34f',
  },
  darkMode: {
    backgroundColor: '#121212',
  },
  lightMode: {
    backgroundColor: '#f0f0f0',
  },
  darkText: {
    color: '#b80000',
  },
  lightText: {
    color: '#b80000',
  },
  darkButton: {
    backgroundColor: '#b80000',
  },
  lightButton: {
    backgroundColor: '#b80000',
  },
  confirmationWrapper: {
  alignItems: 'center',
  marginTop: 16,
},
confirmationText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#c5a34f',
},
});
