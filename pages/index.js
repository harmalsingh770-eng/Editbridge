// pages/index.js

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editors, setEditors] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Redirect after login
      if (currentUser) {
        const email = currentUser.email?.toLowerCase();

        // Admin
        if (email === "admin@editbridge.com") {
          window.location.href = "/admin";
          return;
        }

        // Check editor
        const q = query(
          collection(db, "editors"),
          where("email", "==", email)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          window.location.href = "/editor";
          return;
        }

        // Normal client
        window.location.href = "/client";
        return;
      }

      loadEditors();
    });

    return () => unsub();
  }, []);

  const loadEditors = async () => {
    try {
      const snap = await getDocs(collection(db, "editors"));
      const approved = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((e) => e.approved === true);

      setEditors(approved);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.nav}>
        <h2 style={styles.logo}>EditBridge</h2>

        <Link href="/login" style={styles.loginBtn}>
          Login
        </Link>
      </div>

      {/* Hero */}
      <section style={styles.hero}>
        <div>
          <p style={styles.tag}>PREMIUM EDITOR MARKETPLACE</p>

          <h1 style={styles.title}>
            Find The Best <br />
            Video Editors
          </h1>

          <p style={styles.desc}>
            Hire talented editors for reels,
            YouTube videos, ads and content.
          </p>

          <div style={styles.buttons}>
            <Link href="/login" style={styles.primary}>
              Get Started
            </Link>

            <Link href="/editor-register" style={styles.secondary}>
              Become Editor
            </Link>
          </div>
        </div>
      </section>

      {/* Approved Editors */}
      <section style={styles.section}>
        <h2 style={styles.heading}>
          Approved Editors
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : editors.length === 0 ? (
          <p>No editors yet.</p>
        ) : (
          <div style={styles.grid}>
            {editors.map((e) => (
              <div key={e.id} style={styles.card}>
                <h3>{e.name}</h3>
                <p>{e.skill || "Video Editing"}</p>
                <p>{e.price || "Custom Price"}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#0f172a,#111827,#1e1b4b)",
    color: "white",
    padding: "20px"
  },

  nav: {
    maxWidth: "1200px",
    margin: "auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "30px"
  },

  logo: {
    fontSize: "32px",
    fontWeight: "bold"
  },

  loginBtn: {
    textDecoration: "none",
    color: "white",
    background:
      "linear-gradient(90deg,#7c3aed,#2563eb)",
    padding: "10px 18px",
    borderRadius: "10px"
  },

  hero: {
    maxWidth: "1200px",
    margin: "auto",
    padding: "70px 0"
  },

  tag: {
    color: "#c4b5fd",
    letterSpacing: "3px",
    fontSize: "13px"
  },

  title: {
    fontSize: "58px",
    lineHeight: "1.1",
    marginTop: "15px"
  },

  desc: {
    color: "#d1d5db",
    maxWidth: "500px",
    marginTop: "15px",
    fontSize: "18px"
  },

  buttons: {
    display: "flex",
    gap: "14px",
    marginTop: "30px",
    flexWrap: "wrap"
  },

  primary: {
    textDecoration: "none",
    color: "white",
    background:
      "linear-gradient(90deg,#8b5cf6,#3b82f6)",
    padding: "14px 22px",
    borderRadius: "12px",
    fontWeight: "bold"
  },

  secondary: {
    textDecoration: "none",
    color: "white",
    border: "1px solid #555",
    padding: "14px 22px",
    borderRadius: "12px"
  },

  section: {
    maxWidth: "1200px",
    margin: "auto",
    marginTop: "40px"
  },

  heading: {
    fontSize: "34px",
    marginBottom: "20px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: "20px"
  },

  card: {
    background: "rgba(255,255,255,0.06)",
    padding: "22px",
    borderRadius: "18px",
    backdropFilter: "blur(10px)"
  }
};