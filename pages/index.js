"use client";

import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false); // ✅ no redirect anymore
    });

    return () => unsub();
  }, []);

  // 🔄 Loading screen
  if (loading) {
    return (
      <div style={s.loader}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  // 🎯 Go to dashboard manually
  const goDashboard = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/client"); // simple: all users go here
    }
  };

  return (
    <div style={s.page}>
      {/* NAV */}
      <div style={s.nav}>
        <div style={s.logo}>🎬 EditBridge</div>

        {!user ? (
          <div style={s.navBtns}>
            <button
              onClick={() => router.push("/login")}
              style={s.btn}
            >
              Client
            </button>

            <button
              onClick={() => router.push("/login?type=editor")}
              style={s.btnPrimary}
            >
              Editor
            </button>
          </div>
        ) : (
          <button onClick={goDashboard} style={s.btnPrimary}>
            Dashboard
          </button>
        )}
      </div>

      {/* HERO */}
      <div style={s.hero}>
        <h1 style={s.title}>
          Work with <span style={s.gradient}>Top Editors</span>
        </h1>

        <p style={s.subtitle}>
          Chat instantly, hire fast, and scale your content.
        </p>

        <button onClick={goDashboard} style={s.cta}>
          🚀 Get Started
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617"
  },

  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: 20
  },

  logo: {
    fontWeight: 800,
    fontSize: 18
  },

  navBtns: {
    display: "flex",
    gap: 10
  },

  btn: {
    background: "transparent",
    border: "1px solid #444",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8
  },

  btnPrimary: {
    background: "#7c3aed",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8,
    fontWeight: 600
  },

  hero: {
    textAlign: "center",
    marginTop: 120,
    padding: "0 20px"
  },

  title: {
    fontSize: 40,
    fontWeight: 800
  },

  gradient: {
    background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },

  subtitle: {
    marginTop: 12,
    color: "#94a3b8"
  },

  cta: {
    marginTop: 20,
    padding: 14,
    background: "#6366f1",
    border: "none",
    color: "white",
    borderRadius: 10,
    fontWeight: 600
  }
};