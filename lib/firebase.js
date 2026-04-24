import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCwH5erg-bVoY6ouiZRkGHyiDT7D8R0tns",
  authDomain: "editbridge-manual.firebaseapp.com",
  projectId: "editbridge-manual",
  storageBucket: "editbridge-manual.firebasestorage.app",
  messagingSenderId: "278299438243",
  appId: "1:278299438243:web:c18fd39a654f8450f12316",
  measurementId: "G-Y456QQF6Z1"
};

// Prevent multiple initialization (VERY IMPORTANT in Next.js)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics (safe for Next.js)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
}

export { app, auth, db, analytics };
