"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "editors"));
      setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetch();
  }, []);

  const startChat = async (editorId) => {
    const user = auth.currentUser;
    if (!user) return router.push("/login");

    const chatId = `${user.uid}_${editorId}`;

    await setDoc(doc(db, "chats", chatId), {
      clientId: user.uid,
      editorId,
      unlocked: false,
      createdAt: new Date()
    });

    router.push(`/chat/${chatId}`);
  };

  return (
    <div style={s.page}>
      <h2>Editors</h2>

      {editors.map(e => (
        <div key={e.id} style={s.card}>
          <h3>{e.name}</h3>
          <p>{e.skills?.join(", ")}</p>
          <p>₹{e.price}</p>

          <button onClick={() => window.open(e.portfolioLink)} style={s.port}>
            Portfolio 🎬
          </button>

          <button onClick={() => startChat(e.id)} style={s.pay}>
            Pay to Chat 💰
          </button>
        </div>
      ))}
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
  card: {
    padding: 15,
    marginBottom: 10,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 10
  },
  port: { marginTop: 5, padding: 8, background: "#6366f1", color: "white" },
  pay: { marginTop: 5, padding: 8, background: "#22c55e", color: "white" }
};