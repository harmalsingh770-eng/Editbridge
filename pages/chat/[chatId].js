import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => d.data()));
      bottomRef.current?.scrollIntoView();
    });
  }, [chatId]);

  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    setText("");
  };

  return (
    <div style={s.page}>
      <div style={s.chat}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...s.msg,
              alignSelf: m.sender === auth.currentUser.uid ? "flex-end" : "flex-start"
            }}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <input value={text} onChange={(e) => setText(e.target.value)} style={s.input}/>
        <button onClick={send} style={s.btn}>Send</button>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#020617" },
  chat: { flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 8 },
  msg: { background: "#334155", padding: 8, borderRadius: 10, color: "white" },
  inputRow: { display: "flex", padding: 10 },
  input: { flex: 1, padding: 10 },
  btn: { background: "#7c3aed", color: "white", border: "none", padding: 10 }
};