"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import Reviews from "../components/Reviews";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const router = useRouter();

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

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const openChat = (editorId) => {
    const user = auth.currentUser;
    if (!user) return router.push("/login");

    const chatId = [user.uid, editorId].sort().join("_");
    router.push(`/chat/${chatId}`);
  };

  return (
    <div style={s.page}>
      
      <div style={s.header}>
        <h1 style={s.logo}>🎬 EditBridge</h1>
        <button onClick={logout} style={s.logout}>Logout</button>
      </div>

      <div style={s.grid}>
        {editors.map(e => (
          <div key={e.id} style={s.card}>
            
            <h2>{e.name}</h2>
            <p style={s.bio}>{e.bio}</p>

            <p style={s.skills}>{e.skills?.join(", ")}</p>
            <p style={s.price}>₹{e.price}</p>

            {/* Portfolio */}
            {e.portfolio?.map((link, i) => (
              <a key={i} href={link} target="_blank" style={s.link}>
                🔗 Portfolio {i + 1}
              </a>
            ))}

            <button onClick={() => openChat(e.id)} style={s.chatBtn}>
              💬 Chat
            </button>

            {/* Reviews */}
            <Reviews editorId={e.id} />

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
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  logo: { fontSize: 22, fontWeight: "bold" },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    color: "white"
  },

  grid: {
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))"
  },

  card: {
    padding: 20,
    borderRadius: 16,
    background: "rgba(30,27,75,0.6)",
    backdropFilter: "blur(20px)"
  },

  bio: { opacity: 0.8 },

  skills: { fontSize: 13, opacity: 0.7 },

  price: { fontWeight: "bold", marginTop: 6 },

  link: {
    display: "block",
    marginTop: 6,
    color: "#60a5fa"
  },

  chatBtn: {
    marginTop: 10,
    padding: 10,
    background: "#6366f1",
    border: "none",
    borderRadius: 10,
    color: "white"
  }
};