"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const router = useRouter();

  // 🔄 LOAD EDITORS
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "editors"));

      setEditors(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    };

    fetch();
  }, []);

  // 💬 START CHAT (SAFE)
  const startChat = async (editorId) => {
    const user = auth.currentUser;
    if (!user) return router.push("/login?type=client");

    // ✅ UNIQUE + SAFE CHAT ID
    const chatId = [user.uid, editorId].sort().join("_");

    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);

    // ✅ CREATE ONLY IF NOT EXISTS
    if (!snap.exists()) {
      await setDoc(ref, {
        clientId: user.uid,
        editorId,
        unlocked: false,
        createdAt: new Date()
      });
    }

    router.push(`/chat/${chatId}`);
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>🎬 Find Your Editor</h1>

      {editors.map((e) => (
        <div key={e.id} style={s.card}>
          
          {/* HEADER */}
          <div style={s.top}>
            <h3>{e.name || "Editor"}</h3>

            <span
              style={{
                ...s.status,
                background: e.active ? "#22c55e" : "#ef4444"
              }}
            >
              {e.active ? "Online" : "Offline"}
            </span>
          </div>

          {/* BIO */}
          <p style={s.bio}>{e.bio || "No bio added"}</p>

          {/* SKILLS */}
          <p style={s.skills}>
            {e.skills?.join(", ") || "No skills"}
          </p>

          {/* PRICE */}
          <p style={s.price}>₹{e.price || 0}</p>

          {/* BUTTONS */}
          <div style={s.btnRow}>
            <button
              onClick={() => window.open(e.portfolioLink)}
              style={s.port}
            >
              Portfolio 🎬
            </button>

            <button
              onClick={() => startChat(e.id)}
              style={s.pay}
            >
              Pay to Chat 💰
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// 🎨 STYLES
const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white"
  },

  title: {
    marginBottom: 20
  },

  card: {
    padding: 18,
    marginBottom: 15,
    background: "rgba(30,27,75,0.6)",
    borderRadius: 15,
    border: "1px solid rgba(255,255,255,0.1)"
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  status: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    color: "white"
  },

  bio: {
    marginTop: 8,
    color: "#cbd5f5",
    fontSize: 14
  },

  skills: {
    marginTop: 5,
    fontSize: 13,
    color: "#a5b4fc"
  },

  price: {
    marginTop: 5,
    fontWeight: "bold"
  },

  btnRow: {
    display: "flex",
    gap: 10,
    marginTop: 10
  },

  port: {
    flex: 1,
    padding: 10,
    background: "#6366f1",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer"
  },

  pay: {
    flex: 1,
    padding: 10,
    background: "#22c55e",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer"
  }
};