"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot
} from "firebase/firestore";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "messages"), (snap) => {
      setMessages(snap.docs.map(d => d.data()));
    });

    return () => unsub();
  }, []);

  const send = async () => {
    await addDoc(collection(db, "messages"), {
      text,
      user: auth.currentUser?.email
    });
    setText("");
  };

  return (
    <div style={wrap}>
      <h1>Chat</h1>

      <div style={chatBox}>
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.user}</b>: {m.text}
          </p>
        ))}
      </div>

      <input value={text} onChange={(e)=>setText(e.target.value)} style={input}/>
      <button onClick={send} style={btn}>Send</button>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  padding: "20px",
  background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
  color: "white"
};

const chatBox = {
  height: "300px",
  overflow: "auto",
  background: "#111",
  padding: "10px",
  borderRadius: "10px"
};

const input = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  borderRadius: "10px",
  border: "none"
};

const btn = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  background: "#6366f1",
  border: "none",
  borderRadius: "10px",
  color: "white"
};