"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });

    loadEditors();
  }, []);

  const loadEditors = async () => {
    const snap = await getDocs(collection(db, "editors"));
    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setEditors(data);
  };

  const startChat = async (editorId) => {
    const chatRef = await addDoc(collection(db, "chats"), {
      clientId: user.uid,
      editorId,
      createdAt: new Date(),
      unlocked: false // 🔥 important
    });

    router.push(`/chat/${chatRef.id}`);
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>✨ Choose Your Editor</h1>

      <div style={s.grid}>
        {editors.map(e => (
          <div key={e.id} style={s.card}>
            <h2>{e.name || "Editor"}</h2>
            <p>₹{e.price || 0}</p>

            <button
              style={s.btn}
              onClick={() => startChat(e.id)}
            >
              Start Chat 🚀
            </button>

            <button
              style={s.view}
              onClick={() => router.push(`/profile/${e.id}`)}
            >
              View Portfolio
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white",
    padding: 20
  },

  title: {
    textAlign: "center",
    fontSize: 28,
    marginBottom: 20
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
    gap: 20
  },

  card: {
    background: "rgba(30,27,75,0.6)",
    padding: 20,
    borderRadius: 15
  },

  btn: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#7c3aed",
    border: "none",
    color: "white"
  },

  view: {
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#22c55e",
    border: "none",
    color: "white"
  }
};
