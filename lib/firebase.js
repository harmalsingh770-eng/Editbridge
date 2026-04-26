import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔥 Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCwH5erg-bVoY6ouiZRkGHyiDT7D8R0tns",
  authDomain: "editbridge-manual.firebaseapp.com",
  projectId: "editbridge-manual",

  // ✅ IMPORTANT FIX (use .appspot.com)
  storageBucket: "editbridge-manual.appspot.com",

  messagingSenderId: "278299438243",
  appId: "1:278299438243:web:c18fd39a654f8450f12316",
  measurementId: "G-Y456QQF6Z1"
};

// ✅ Prevent multiple initialization (Next.js safe)
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// 🔐 Auth
export const auth = getAuth(app);

// 🗄 Firestore
export const db = getFirestore(app);

// 📦 Storage
export const storage = getStorage(app);

// ⚡ Enable offline persistence (safe)
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.log("⚠️ Multiple tabs open, persistence disabled");
    } else if (err.code === "unimplemented") {
      console.log("⚠️ Persistence not supported");
    }
  });
}