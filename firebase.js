// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-52MFkEgLrNqrCLnYZw2lEnKk7G4dIb0",
  authDomain: "luba-d-01.firebaseapp.com",
  databaseURL: "https://luba-d-01-default-rtdb.firebaseio.com",
  projectId: "luba-d-01",
  storageBucket: "luba-d-01.firebasestorage.app",
  messagingSenderId: "969180254695",
  appId: "1:969180254695:web:1b3f3f78a1ecd56d3ded42",
  measurementId: "G-E3CNQ4E0VY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);