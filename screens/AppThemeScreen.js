import React, { useContext, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../ThemeContext';

export default function AppThemeScreen() {
  const { isDarkMode, toggleTheme, colors } = useContext(ThemeContext); // Destructure colors from ThemeContext
  const themeName = isDarkMode ? "Dark" : "Light";
  const [saveConfirmation, setSaveConfirmation] = useState("");

  const handleSave = () => {
    setSaveConfirmation("Theme saved!");
    setTimeout(() => setSaveConfirmation(""), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> {/* Apply theme background */}
      <Text style={[styles.title, { color: colors.iconRed }]}> {/* Apply theme color */}
        Choose Your App Theme
      </Text>

      <View style={styles.themeOption}>
        <Text style={[styles.optionText, { color: colors.text }]}> {/* Apply theme color */}
          {themeName} Mode
        </Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          thumbColor={isDarkMode ? colors.buttonText : colors.iconRed} // Customize thumb color
          trackColor={{ false: colors.borderColor, true: colors.iconRed }} // Customize track colors
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.iconRed }]} // Apply theme background
        onPress={handleSave}
      >
        <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Save Theme</Text> {/* Apply theme color */}
      </TouchableOpacity>

      {saveConfirmation ? (
        <View style={styles.confirmationWrapper}>
          <Text style={[styles.confirmationText, { color: colors.text }]}> {/* Apply theme color */}
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
    // backgroundColor handled by theme
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    // color handled by theme
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  optionText: {
    fontSize: 18,
    // color handled by theme
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    // backgroundColor handled by theme
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color handled by theme
  },
  confirmationWrapper: {
    alignItems: 'center',
    marginTop: 16,
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '500',
    // color handled by theme
  },
  // Removed theme-specific styles as they are now handled by the 'colors' object from context
});
