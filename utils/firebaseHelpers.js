import { ref, get, update } from 'firebase/database';
import { database } from '../firebase';

const fetchUserDetails = async (database, userId) => {
  try {
    const userRef = ref(database, `users/${userId}`); // root-level path
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        username: data.username || 'Unknown',
        phoneNumber: data.phoneNumber || 'N/A',
        imageUrl: data.imageUrl || null,
      };
    } else {
      console.warn('No user data found for:', userId);
      return { username: 'Unknown', phoneNumber: 'N/A' };
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return { username: 'Unknown', phoneNumber: 'N/A' };
  }
};

// Function to save image URL to Firebase
export const saveImageUrlToFirebase = async (userId, imageUrl) => {
  try {
    const userRef = ref(database, 'users/' + userId);
    await update(userRef, { imageUrl });
    console.log('Image URL saved to Firebase');
  } catch (error) {
    console.error('Failed to save image URL to Firebase:', error);
    throw error;
  }
};

export default fetchUserDetails;
