"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔐 Auth check
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
      setLoading(false);
    });
  }, []);

  // 🚀 Start chat (LOCKED by default)
  const startChat = async (editorId) => {
    const chatRef = await addDoc(collection(db, "chats"), {
      clientId: user.uid,
      editorId: editorId,
      createdAt: serverTimestamp(),

      // 🔒 Pay system
      unlocked: false,

      // status
      clientOnline: true,
      editorOnline: false,
      typingClient: false,
      typingEditor: false,
    });

    router.push(`/chat/${chatRef.id}`);
  };

  if (loading) return null;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>EditBridge</h2>
        <span style={{ fontSize: 12, color: "#aaa" }}>
          Hire Editors Instantly
        </span>
      </div>

      {/* EDITOR LIST */}
      <div style={styles.grid}>
        {/* SAMPLE EDITOR CARD */}
        <div style={styles.card}>
          <div style={styles.avatar}>E</div>

          <h3 style={styles.name}>Pro Editor</h3>
          <p style={styles.desc}>Reels • YouTube • Cinematic</p>

          <div style={styles.tags}>
            <span>🔥 Fast</span>
            <span>⭐ 4.9</span>
          </div>

          <button
            style={styles.chatBtn}
            onClick={() => startChat(""L0S5natsSmWjrHCcYqPpIihdRri1"")}
          >
            Start Chat 💬
          </button>
        </div>

        {/* You can duplicate this card for multiple editors */}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
    color: "#fff",
    padding: 20,
  },

  header: {
    marginBottom: 20,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 20,
  },

  card: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 20,
    backdropFilter: "blur(15px)",
    boxShadow: "0 0 30px rgba(0,0,0,0.5)",
    textAlign: "center",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#4f46e5,#06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    margin: "0 auto 10px",
  },

  name: {
    margin: "10px 0 5px",
  },

  desc: {
    fontSize: 12,
    color: "#94a3b8",
  },

  tags: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    margin: "10px 0",
    fontSize: 12,
    color: "#ccc",
  },

  chatBtn: {
    marginTop: 10,
    padding: "12px 20px",
    borderRadius: 10,
    border: "none",
    background:
      "linear-gradient(90deg,#4f46e5,#06b6d4)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
};