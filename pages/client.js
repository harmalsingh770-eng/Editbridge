"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot
} from "firebase/firestore";
import Reviews from "../components/reviews";

export default function Client() {
  const [editors, setEditors] = useState([]);

  // 🔥 Fetch editors
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "editors"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Only approved editors
      setEditors(data.filter((e) => e.approved));
    });

    return () => unsub();
  }, []);

  return (
    <div style={s.page}>

      {/* 🔥 HEADER */}
      <div style={s.header}>
        <h1 style={s.logo}>EditBridge</h1>
        <button style={s.cta}>🚀 Get Started</button>
      </div>

      {/* 🔥 HERO */}
      <div style={s.hero}>
        <h1 style={s.title}>
          Work with <span style={s.gradient}>Top Editors</span>
        </h1>

        <p style={s.subtitle}>
          Chat instantly, hire fast, and scale your content production.
        </p>
      </div>

      {/* 🔥 EDITORS LIST */}
      <div style={s.grid}>
        {editors.map((editor) => (
          <div key={editor.id} style={s.card}>

            <h2>{editor.name}</h2>

            <p style={s.skills}>
              {editor.skills?.join(", ")}
            </p>

            <p style={s.price}>₹{editor.price}</p>

            {/* ⭐ REVIEWS (Top 2) */}
            <reviews editorId={editor.id} />

          </div>
        ))}
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
    padding: "10px 18px",
    borderRadius: 12,
    background: "#6366f1",
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
  }
};