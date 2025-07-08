import { auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Logs out the current user and clears local data.
 * Optionally pass the userType for future role-based extensions.
 */
export const logout = async (navigation, userType = 'driver') => {
  try {
    // Firebase sign out
    await auth.signOut();

    // Clear all persisted app data
    await AsyncStorage.clear();

    // Navigate to Auth screen with login tab active
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth', params: { showLogin: true } }],
    });

    console.log(`${userType} logout successful.`);
  } catch (error) {
    console.error(`Logout failed for ${userType}:`, error);
  }
};
