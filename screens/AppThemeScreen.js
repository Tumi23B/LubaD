import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, AsyncStorage } from 'react-native';

export default function AppThemeScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);  // For toggling theme
  const [themeName, setThemeName] = useState("Light");  // To display the theme name

  // Check and load the current theme when the component mounts
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme) {
        setIsDarkMode(savedTheme === "dark");
        setThemeName(savedTheme === "dark" ? "Dark" : "Light");
      }
    };
    loadTheme();
  }, []);

  // Toggle theme between light and dark
  const toggleSwitch = async () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    setThemeName(newTheme === "dark" ? "Dark" : "Light");
    await AsyncStorage.setItem("theme", newTheme);  // Save the selected theme
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
          onValueChange={toggleSwitch}
          thumbColor={isDarkMode ? "#fff" : "#b80000"}
          trackColor={{ false: "#ccc", true: "#b80000" }}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isDarkMode ? styles.darkButton : styles.lightButton]}
        onPress={() => {}}
      >
        <Text style={styles.saveButtonText}>Save Theme</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  lightMode: {
    backgroundColor: '#fff',
  },
  darkMode: {
    backgroundColor: '#333',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionText: {
    fontSize: 18,
    marginRight: 10,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  lightButton: {
    backgroundColor: '#b80000',
  },
  darkButton: {
    backgroundColor: '#444',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  darkText: {
    color: '#fff',
  },
  lightText: {
    color: '#000',
  },
});
