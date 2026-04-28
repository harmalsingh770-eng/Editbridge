"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [chat, setChat] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");

  const user = auth.currentUser;

  // 🔥 LOAD CHAT + MESSAGES
  useEffect(() => {
    if (!chatId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (snap.exists()) {
        setChat(snap.data());
      }
    };

    load();

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMsgs(snap.docs.map((d) => d.data()));
    });

    return () => unsub();
  }, [chatId]);

  // ⏳ LOADING
  if (!chat) {
    return <div style={s.loader}>Loading...</div>;
  }

  // 🔒 LOCK ONLY FOR CLIENT
  if (!chat.unlocked && user?.uid === chat.clientId) {
    return (
      <div style={s.lock}>
        <h2>🔒 Chat Locked</h2>
        <button
          style={s.payBtn}
          onClick={() => router.push(`/payment?chatId=${chatId}`)}
        >
          Pay ₹10
        </button>
      </div>
    );
  }

  // ✉️ SEND MESSAGE
  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: new Date()
    });

    setText("");
  };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>💬 Chat</div>

      {/* MESSAGES */}
      <div style={s.chat}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={m.sender === user.uid ? s.me : s.other}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={s.input}
        />
        <button onClick={send} style={s.send}>
          Send
        </button>
      </div>
    </div>
  );
}

// 🎨 STYLES
const s = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white"
  },

  header: {
    padding: 15,
    fontWeight: "bold",
    background: "#0f172a"
  },

  chat: {
    flex: 1,
    padding: 10,
    display: "flex",
    flexDirection: "column"
  },

  me: {
    alignSelf: "flex-end",
    background: "#7c3aed",
    padding: 10,
    margin: 5,
    borderRadius: 12,
    maxWidth: "70%"
  },

  other: {
    alignSelf: "flex-start",
    background: "#334155",
    padding: 10,
    margin: 5,
    borderRadius: 12,
    maxWidth: "70%"
  },

  inputRow: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #333"
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: "none",
    outline: "none"
  },

  send: {
    marginLeft: 10,
    padding: "10px 15px",
    background: "#22c55e",
    border: "none",
    color: "white",
    borderRadius: 10
  },

  lock: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    color: "white"
  },

  payBtn: {
    marginTop: 15,
    padding: 12,
    background: "#22c55e",
    border: "none",
    borderRadius: 10,
    color: "white"
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    color: "white"
  }
};