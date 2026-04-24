import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwH5erg-bVoY6ouiZRkGHyiDT7D8R0tns",
  authDomain: "editbridge-manual.firebaseapp.com",
  projectId: "editbridge-manual",
  storageBucket: "editbridge-manual.firebasestorage.app",
  messagingSenderId: "278299438243",
  appId: "1:278299438243:web:c18fd39a654f8450f12316"
};

const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
