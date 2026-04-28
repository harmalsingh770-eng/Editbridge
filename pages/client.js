"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import Reviews from "../components/Reviews";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const [paidChats, setPaidChats] = useState([]);
  const router = useRouter();

  // 🔥 Fetch editors
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "editors"), (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEditors(data.filter(e => e.approved && e.active));
    });

    return () => unsub();
  }, []);

  // 🔥 Paid chats (deal system)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "paymentRequests"),
      where("uid", "==", user.uid),
      where("status", "==", "approved")
    );

    const unsub = onSnapshot(q, (snap) => {
      const chats = snap.docs.map(doc => doc.data().chatId);
      setPaidChats(chats);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleChat = (editorId) => {
    const user = auth.currentUser;
    if (!user) return router.push("/login");

    const chatId = [user.uid, editorId].sort().join("_");

    if (paidChats.includes(chatId)) {
      router.push(`/chat/${chatId}`);
    } else {
      router.push(`/pay/${editorId}`);
    }
  };

  return (
    <div style={s.page}>
      
      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.logo}>🎬 EditBridge</h1>
        <button onClick={logout} style={s.logout}>Logout</button>
      </div>

      {/* HERO */}
      <div style={s.hero}>
        <h1 style={s.title}>
          Work with <span style={s.gradient}>Top Editors</span>
        </h1>
        <p style={s.subtitle}>
          Hire fast. Chat instantly. Scale content.
        </p>
      </div>

      {/* EDITORS */}
      <div style={s.grid}>
        {editors.map(editor => (
          <div key={editor.id} style={s.card}>
            
            <h2 style={s.name}>{editor.name}</h2>

            {/* BIO */}
            <p style={s.bio}>{editor.bio}</p>

            {/* SKILLS */}
            <div style={s.skillsWrap}>
              {editor.skills?.map((skill, i) => (
                <span key={i} style={s.skill}>{skill}</span>
              ))}
            </div>

            {/* PRICE */}
            <div style={s.price}>₹{editor.price}</div>

            {/* PORTFOLIO */}
            {editor.portfolio?.length > 0 && (
              <div style={s.portfolioWrap}>
                {editor.portfolio.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    style={s.portfolio}
                  >
                    🔗 View Work {i + 1}
                  </a>
                ))}
              </div>
            )}

            {/* CHAT BUTTON */}
            <button
              onClick={() => handleChat(editor.id)}
              style={s.chatBtn}
            >
              💬 Chat with Editor
            </button>

            {/* REVIEWS */}
            <Reviews editorId={editor.id} />

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
    background: "radial-gradient(circle at top,#0f172a,#020617)",
    color: "white",
    fontFamily: "sans-serif"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logo: {
    fontSize: 22,
    fontWeight: 800
  },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    color: "white",
    cursor: "pointer"
  },

  hero: {
    textAlign: "center",
    marginTop: 50
  },

  title: {
    fontSize: 34,
    fontWeight: 800
  },

  gradient: {
    background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },

  subtitle: {
    marginTop: 10,
    color: "#94a3b8"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: 20,
    marginTop: 40
  },

  card: {
    padding: 20,
    borderRadius: 18,
    background: "rgba(30,41,59,0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "0.3s"
  },

  name: {
    fontSize: 20,
    fontWeight: 700
  },

  bio: {
    marginTop: 8,
    fontSize: 13,
    color: "#cbd5f5"
  },

  skillsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10
  },

  skill: {
    background: "#334155",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11
  },

  price: {
    marginTop: 12,
    fontWeight: 700,
    color: "#22c55e"
  },

  portfolioWrap: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 4
  },

  portfolio: {
    fontSize: 12,
    color: "#60a5fa",
    textDecoration: "none"
  },

  chatBtn: {
    marginTop: 14,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    border: "none",
    color: "white",
    fontWeight: 600,
    cursor: "pointer"
  }
};