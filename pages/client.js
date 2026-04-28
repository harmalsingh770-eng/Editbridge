"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Client() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 AUTH CHECK (FIXES LOGIN ISSUE)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login"); // redirect if not logged in
      } else {
        setUser(u);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // 🚀 START CHAT
  const startChat = async () => {
    if (!user) return;

    try {
      const chatRef = await addDoc(collection(db, "chats"), {
        clientId: user.uid,
        editorId: "L0S5natsSmWjrHCcYqPpIihdRri1", // your editor UID
        createdAt: serverTimestamp(),
        unlocked: false, // 🔒 locked (Option B)
      });

      router.push(`/chat/${chatRef.id}`);
    } catch (err) {
      alert("Error creating chat: " + err.message);
    }
  };

  // ⏳ LOADING STATE
  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: 50 }}>Loading...</h2>;
  }

  // 🎨 UI
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Client Dashboard</h1>
        <p style={styles.subtitle}>Start a conversation with editor</p>

        <button style={styles.button} onClick={startChat}>
          Start Chat 🚀
        </button>
      </div>
    </div>
  );
}

// 💎 STYLES (CLEAN PREMIUM LOOK)
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 40px rgba(0,0,0,0.5)",
  },
  title: {
    color: "#fff",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: "30px",
  },
  button: {
    padding: "12px 25px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(90deg, #22c55e, #4ade80)",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
  },
};