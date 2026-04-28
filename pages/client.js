"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import Reviews from "../components/Reviews";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const [user, setUser] = useState(null);
  const [approvedEditors, setApprovedEditors] = useState([]);
  const router = useRouter();

  // 🔐 AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
    });

    return () => unsub();
  }, []);

  // 📦 FETCH EDITORS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "editors"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setEditors(data.filter((e) => e.approved));
    });

    return () => unsub();
  }, []);

  // ✅ CHECK APPROVED PAYMENTS
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "paymentRequests"),
      where("uid", "==", user.uid),
      where("status", "==", "approved")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => doc.data().editorId);
      setApprovedEditors(list);
    });

    return () => unsub();
  }, [user]);

  // 💸 GO TO PAY PAGE (/pay/[editorId])
  const goToPay = (editorId) => {
    router.push(`/pay/${editorId}`);
  };

  // 💬 OPEN CHAT
  const openChat = (editorId) => {
    router.push(`/chat?editorId=${editorId}`);
  };

  // 🚪 LOGOUT
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.logo}>🎬 EditBridge</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.cta}>🚀 Get Started</button>

          <button style={s.logout} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* HERO */}
      <div style={s.hero}>
        <h1 style={s.title}>
          Work with <span style={s.gradient}>Top Editors</span>
        </h1>

        <p style={s.subtitle}>
          Chat instantly, hire fast, and scale your content production.
        </p>
      </div>

      {/* EDITORS */}
      <div style={s.grid}>
        {editors.map((editor) => {
          const isUnlocked = approvedEditors.includes(editor.id);

          return (
            <div key={editor.id} style={s.card}>
              <h2>{editor.name}</h2>

              <p style={s.skills}>
                {editor.skills?.join(", ")}
              </p>

              <p style={s.price}>₹{editor.price}</p>

              {/* 🔥 PAY / CHAT */}
              {!isUnlocked ? (
                <button
                  style={s.payBtn}
                  onClick={() => goToPay(editor.id)}
                >
                  💸 Pay ₹10 to Unlock Chat
                </button>
              ) : (
                <button
                  style={s.chatBtn}
                  onClick={() => openChat(editor.id)}
                >
                  💬 Chat with Editor
                </button>
              )}

              {/* ⭐ REVIEWS */}
              <Reviews editorId={editor.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "radial-gradient(circle,#020617,#0f172a,#4c1d95)",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logo: {
    fontSize: 22,
    fontWeight: "bold"
  },

  cta: {
    padding: "10px 16px",
    borderRadius: 10,
    background: "#6366f1",
    border: "none",
    color: "white"
  },

  logout: {
    padding: "10px 16px",
    borderRadius: 10,
    background: "#ef4444",
    border: "none",
    color: "white",
    cursor: "pointer"
  },

  hero: {
    textAlign: "center",
    marginTop: 60
  },

  title: {
    fontSize: 32,
    fontWeight: "bold"
  },

  gradient: {
    background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },

  subtitle: {
    marginTop: 10,
    opacity: 0.7
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
    gap: 20,
    marginTop: 40
  },

  card: {
    padding: 20,
    borderRadius: 16,
    background: "rgba(30,27,75,0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)"
  },

  skills: {
    fontSize: 13,
    opacity: 0.7
  },

  price: {
    marginTop: 8,
    fontWeight: "bold"
  },

  payBtn: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#f59e0b",
    border: "none",
    borderRadius: 10,
    color: "white",
    cursor: "pointer"
  },

  chatBtn: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#22c55e",
    border: "none",
    borderRadius: 10,
    color: "white",
    cursor: "pointer"
  }
};