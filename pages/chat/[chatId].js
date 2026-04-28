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
  query,
  orderBy,
  updateDoc
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [chat, setChat] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const user = auth.currentUser;

  // 🔄 LOAD CHAT + MESSAGES
  useEffect(() => {
    if (!chatId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (snap.exists()) setChat(snap.data());
    };

    load();

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      setMsgs(data);

      // ✅ AUTO SCROLL
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // ✅ MARK AS SEEN
      data.forEach(async (m) => {
        if (m.sender !== user?.uid && !m.seen) {
          await updateDoc(
            doc(db, "chats", chatId, "messages", m.id),
            { seen: true }
          );
        }
      });
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
      createdAt: new Date(),
      seen: false
    });

    setText("");
  };

  // 🔗 LINK DETECTOR
  const renderText = (msg) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return msg.split(urlRegex).map((part, i) =>
      part.match(urlRegex) ? (
        <a key={i} href={part} target="_blank" style={s.link}>
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  // ⏱ FORMAT TIME
  const formatTime = (date) => {
    if (!date) return "";
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>💬 Chat</div>

      {/* MESSAGES */}
      <div style={s.chat}>
        {msgs.map((m) => {
          const isMe = m.sender === user.uid;

          return (
            <div
              key={m.id}
              style={isMe ? s.meWrap : s.otherWrap}
            >
              <div style={isMe ? s.me : s.other}>
                <div>{renderText(m.text)}</div>

                <div style={s.meta}>
                  <span>{formatTime(m.createdAt)}</span>

                  {isMe && (
                    <span style={{ marginLeft: 5 }}>
                      {m.seen ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={s.input}
          onKeyDown={(e) => e.key === "Enter" && send()}
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
    background: "#0f172a",
    textAlign: "center"
  },

  chat: {
    flex: 1,
    padding: 10,
    overflowY: "auto"
  },

  meWrap: {
    display: "flex",
    justifyContent: "flex-end"
  },

  otherWrap: {
    display: "flex",
    justifyContent: "flex-start"
  },

  me: {
    background: "#7c3aed",
    padding: 10,
    margin: 5,
    borderRadius: 12,
    maxWidth: "70%"
  },

  other: {
    background: "#334155",
    padding: 10,
    margin: 5,
    borderRadius: 12,
    maxWidth: "70%"
  },

  meta: {
    fontSize: 10,
    marginTop: 5,
    display: "flex",
    justifyContent: "flex-end",
    opacity: 0.7
  },

  link: {
    color: "#60a5fa",
    textDecoration: "underline"
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