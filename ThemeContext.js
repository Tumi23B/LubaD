// ThemeContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // 'dark' or 'light'
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setIsDarkMode(storedTheme === 'dark');
      } else {
        setIsDarkMode(systemScheme === 'dark');
      }
    };
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(newTheme === 'dark');
    await AsyncStorage.setItem('theme', newTheme);
  };

  const colors = isDarkMode
    ? {
        background: '#121212',
        text: '#b80000',
        cardBackground: '#1E1E1E',
        iconRed: '#b80000', // For primary accent elements
        textSecondary: '#AAAAAA', // Lighter text for descriptions/placeholders
        borderColor: '#c5a34f', // Borders for inputs/cards in dark mode
        buttonText: '#FFFFFF', // Text color for buttons (often white)
        tagline:'#c5a34f', // sub text color
      }
    : {
        background: '#FFFFFF',
        text: '#b80000',
        cardBackground: '#F5F5F5',
        iconRed: '#b80000', // For primary accent elements
        textSecondary: '#666666', // Lighter text for descriptions/placeholders
        borderColor: '#c5a34f', // Borders for inputs/cards in light mode
        buttonText: '#FFFFFF', // Text color for buttons (often white, for contrast on colored buttons)
        tagline:'#c5a34f', // sub text color
      };

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};