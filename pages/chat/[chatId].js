"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  doc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

export default function Chat() {
  const { chatId } = useRouter().query;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chat, setChat] = useState(null);

  useEffect(() => {
    if (!chatId) return;

    onSnapshot(doc(db, "chats", chatId), (d) => setChat(d.data()));

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));

    onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [chatId]);

  const send = async () => {
    if (!chat?.unlocked) return alert("Unlock chat first");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    setText("");
  };

  return (
    <div style={s.page}>
      <h3>Chat</h3>

      {!chat?.unlocked && (
        <button onClick={() => updateDoc(doc(db, "chats", chatId), { unlocked: true })} style={s.unlock}>
          Unlock ₹10
        </button>
      )}

      <div style={s.chatBox}>
        {messages.map((m) => (
          <div key={m.id} style={m.sender === auth.currentUser?.uid ? s.me : s.other}>
            {m.text}
          </div>
        ))}
      </div>

      <div style={s.inputRow}>
        <input value={text} onChange={(e) => setText(e.target.value)} style={s.input} />
        <button onClick={send} style={s.send}>Send</button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding:20, color:"#fff" },
  unlock: { padding:10, background:"#f59e0b", borderRadius:8, marginBottom:10 },
  chatBox: { height:"60vh", overflowY:"auto" },
  me: { background:"#7c3aed", padding:10, borderRadius:10, margin:5, alignSelf:"flex-end" },
  other: { background:"#334155", padding:10, borderRadius:10, margin:5 },
  inputRow: { display:"flex", marginTop:10 },
  input: { flex:1, padding:10, borderRadius:8 },
  send: { padding:10, background:"#7c3aed", color:"#fff", borderRadius:8 }
};