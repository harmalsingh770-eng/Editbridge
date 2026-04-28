"use client";

import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  doc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chat, setChat] = useState(null);

  const bottomRef = useRef();

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);

    const unsubChat = onSnapshot(chatRef, (docSnap) => {
      setChat(docSnap.data());
    });

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubMsg = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubChat();
      unsubMsg();
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!chat?.unlocked) return;

    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp(),
      seen: false,
    });

    setText("");
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h3 style={{ margin: 0 }}>Editor</h3>
          <span style={{ fontSize: 12, color: "#aaa" }}>
            {chat?.editorOnline ? "🟢 Online" : "Last seen recently"}
          </span>
        </div>
      </div>

      {/* LOCK BANNER */}
      {!chat?.unlocked && (
        <div style={styles.lockBanner}>
          🔒 Chat Locked
          <button
            style={styles.unlockBtn}
            onClick={async () => {
              await updateDoc(doc(db, "chats", chatId), {
                unlocked: true,
              });
            }}
          >
            Unlock ₹10 💰
          </button>
        </div>
      )}

      {/* MESSAGES */}
      <div style={styles.messages}>
        {messages.map((msg) => {
          const isMe = msg.sender === user?.uid;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  background: isMe
                    ? "linear-gradient(135deg,#4f46e5,#06b6d4)"
                    : "#1e293b",
                }}
              >
                {msg.text}

                <div style={styles.meta}>
                  {msg.createdAt?.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {isMe && (
                    <span style={{ marginLeft: 5 }}>
                      {msg.seen ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div style={styles.inputArea}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.send}>
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(180deg,#0f172a,#020617)",
    color: "#fff",
  },

  header: {
    padding: 15,
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },

  lockBanner: {
    padding: 10,
    textAlign: "center",
    background:
      "linear-gradient(90deg,#f59e0b,#ef4444)",
    display: "flex",
    justifyContent: "center",
    gap: 10,
    alignItems: "center",
  },

  unlockBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 15,
  },

  bubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "70%",
    color: "#fff",
    fontSize: 14,
  },

  meta: {
    fontSize: 10,
    marginTop: 5,
    opacity: 0.7,
    textAlign: "right",
  },

  inputArea: {
    display: "flex",
    padding: 10,
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "none",
    outline: "none",
    background: "#1e293b",
    color: "#fff",
  },

  send: {
    marginLeft: 10,
    padding: "10px 15px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
    color: "#fff",
    cursor: "pointer",
  },
};