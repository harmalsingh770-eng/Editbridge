import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCwH5erg-bVoY6ouiZRkGHyiDT7D8R0tns",
  authDomain: "editbridge-manual.firebaseapp.com",
  projectId: "editbridge-manual",
  storageBucket: "editbridge-manual.appspot.com",
  messagingSenderId: "278299438243",
  appId: "1:278299438243:web:c18fd39a654f8450f12316",
  measurementId: "G-Y456QQF6Z1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);