"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, doc, getDoc
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const user = auth.currentUser;

  // 🔐 PAYWALL (FIXED FOR EDITOR)
  useEffect(() => {
    if (!chatId || !user) return;

    const [u1, u2] = chatId.split("_");

    // ✅ editor always allowed
    if (user.uid === u2) {
      setIsPaid(true);
      setLoading(false);
      return;
    }

    const ref = doc(db, "clientAccess", chatId);

    getDoc(ref).then(snap => {
      if (snap.exists() && snap.data().status === "approved") {
        setIsPaid(true);
      } else {
        setIsPaid(false);
      }
      setLoading(false);
    });
  }, [chatId, user]);

  // 💬 CHAT
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [chatId]);

  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp()
    });

    setText("");
  };

  // ⏳ LOADING STATE
  if (loading) {
    return (
      <div style={s.loaderPage}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  // 🔒 LOCK SCREEN
  if (!isPaid) {
    return (
      <div style={s.lock}>
        <div style={s.lockCard}>
          <h2 style={{ marginBottom: 10 }}>🔒 Chat Locked</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Pay ₹10 to start chatting with this editor
          </p>
          <button
            onClick={() => router.push(`/pay/${chatId.split("_")[1]}`)}
            style={s.unlockBtn}
          >
            Unlock Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.backBtn}>←</button>
        <span style={s.title}>Chat</span>
      </div>

      {/* MESSAGES */}
      <div style={s.chat}>
        {messages.length === 0 && (
          <p style={s.empty}>Start the conversation 👋</p>
        )}

        {messages.map(m => {
          const me = m.sender === user.uid;

          return (
            <div key={m.id} style={{
              ...s.msg,
              alignSelf: me ? "flex-end" : "flex-start",
              background: me
                ? "linear-gradient(135deg,#7c3aed,#6366f1)"
                : "#1e293b"
            }}>
              {m.text}
            </div>
          );
        })}

        <div ref={bottomRef}/>
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          style={s.input}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button onClick={send} style={s.send}>Send</button>
      </div>
    </div>
  );
}

const s = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },

  backBtn: {
    background: "#1e293b",
    border: "none",
    color: "white",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer"
  },

  title: {
    fontWeight: 700,
    fontSize: 16
  },

  chat: {
    flex: 1,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto"
  },

  msg: {
    padding: "10px 14px",
    borderRadius: 14,
    maxWidth: "75%",
    fontSize: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
  },

  empty: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 20
  },

  inputRow: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  },

  input: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#1e293b",
    border: "none",
    color: "white",
    outline: "none"
  },

  send: {
    padding: "12px 16px",
    background: "linear-gradient(135deg,#7c3aed,#6366f1)",
    border: "none",
    color: "white",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 600
  },

  lock: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)"
  },

  lockCard: {
    background: "#1e293b",
    padding: 30,
    borderRadius: 16,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)"
  },

  unlockBtn: {
    marginTop: 15,
    padding: "12px 20px",
    background: "linear-gradient(135deg,#7c3aed,#6366f1)",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600
  },

  loaderPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617"
  },

  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #334155",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};