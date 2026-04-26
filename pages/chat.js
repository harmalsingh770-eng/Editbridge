"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  runTransaction
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const router = useRouter();

  const room = router.query.room;

  // 🔐 CREDIT CHECK
  useEffect(() => {
    const run = async () => {
      const ref = doc(db, "users", auth.currentUser.uid);

      await runTransaction(db, async (t) => {
        const snap = await t.get(ref);
        let c = snap.data()?.credits || 0;

        if (c < 10) {
          router.push("/payment");
          throw "no credit";
        }

        t.update(ref, { credits: c - 10 });
      });
    };

    if (room) run();
  }, [room]);

  // 📡 LOAD CHAT
  useEffect(() => {
    if (!room) return;

    return onSnapshot(
      collection(db, "chats", room, "messages"),
      (s) => setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [room]);

  const send = async () => {
    if (!text) return;

    await addDoc(collection(db, "chats", room, "messages"), {
      text,
      user: auth.currentUser.email
    });

    setText("");
  };

  const del = async (id) => {
    await deleteDoc(doc(db, "chats", room, "messages", id));
  };

  const clear = async () => {
    if (!confirm("Clear chat?")) return;
    msgs.forEach(m => del(m.id));
  };

  return (
    <div style={wrap}>
      
      <h1>💬 Private Chat</h1>

      <button onClick={clear} style={clearBtn}>
        Clear Chat
      </button>

      <div style={chatBox}>
        {msgs.map(m => (
          <div key={m.id} style={msgRow}>
            <span><b>{m.user}</b>: {m.text}</span>
            <button onClick={()=>del(m.id)} style={delBtn}>❌</button>
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={e=>setText(e.target.value)}
        style={input}
        placeholder="Type message..."
      />

      <button onClick={send} style={sendBtn}>
        Send
      </button>

    </div>
  );
}

/* UI */
const wrap = {
  minHeight: "100vh",
  padding: "20px",
  background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
  color: "white"
};

const chatBox = {
  height: "320px",
  overflow: "auto",
  background: "#111",
  padding: "10px",
  borderRadius: "10px",
  marginTop: "10px"
};

const msgRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  background: "#1e1b4b",
  padding: "8px",
  borderRadius: "8px"
};

const delBtn = {
  background: "transparent",
  border: "none",
  color: "#ef4444"
};

const clearBtn = {
  background: "#ef4444",
  padding: "8px",
  borderRadius: "8px",
  border: "none",
  color: "white"
};

const input = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  borderRadius: "10px",
  border: "none"
};

const sendBtn = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  background: "#6366f1",
  border: "none",
  borderRadius: "10px",
  color: "white"
};