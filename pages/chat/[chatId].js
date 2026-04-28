"use client";

import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ChatPage() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [locked, setLocked] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const bottomRef = useRef();

  // 🔐 AUTH
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });
  }, []);

  // 📦 LOAD CHAT DATA
  useEffect(() => {
    if (!chatId || !user) return;

    const loadChat = async () => {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (!snap.exists()) return;

      const data = snap.data();
      setChat(data);

      const client = user.uid === data.clientId;
      setIsClient(client);

      // 🔥 ONLY CLIENT LOCK
      if (client && !data.unlocked) {
        setLocked(true);
      } else {
        setLocked(false);
      }
    };

    loadChat();
  }, [chatId, user]);

  // 💬 MESSAGES LISTENER
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => d.data()));
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    });

    return () => unsub();
  }, [chatId]);

  // ✉️ SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: new Date()
    });

    setText("");
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={s.page}>
      
      {/* HEADER */}
      <div style={s.header}>
        <span>💬 Chat</span>
      </div>

      {/* 🔒 LOCK BAR */}
      {locked && isClient && (
        <div style={s.lockBar}>
          🔒 Chat Locked
          <button onClick={() => router.push(`/pay/${chatId}`)}>
            Unlock ₹10
          </button>
        </div>
      )}

      {/* 💬 CHAT AREA */}
      <div style={s.chatArea}>
        {messages.map((m, i) => {
          const isMe = m.sender === user?.uid;

          return (
            <div
              key={i}
              style={{
                ...s.messageRow,
                justifyContent: isMe ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  ...s.bubble,
                  background: isMe
                    ? "linear-gradient(135deg,#7c3aed,#9333ea)"
                    : "#1e293b"
                }}
              >
                <div>{m.text}</div>
                <div style={s.time}>{formatTime(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      {/* ⛔ INPUT LOCK */}
      {!locked && (
        <div style={s.inputBar}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            style={s.input}
          />
          <button onClick={sendMessage} style={s.send}>
            ➤
          </button>
        </div>
      )}
    </div>
  );
}

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
    background: "rgba(15,23,42,0.8)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  },

  lockBar: {
    background: "linear-gradient(90deg,#f59e0b,#ef4444)",
    padding: 10,
    textAlign: "center"
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },

  messageRow: {
    display: "flex"
  },

  bubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "70%",
    fontSize: 14
  },

  time: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "right"
  },

  inputBar: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(15,23,42,0.8)"
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
    padding: "0 15px",
    borderRadius: "50%",
    background: "#7c3aed",
    color: "white",
    border: "none",
    fontSize: 18
  }
};
