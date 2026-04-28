"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection, addDoc, query, where,
  onSnapshot, serverTimestamp
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, "messages"), where("chatId", "==", chatId));

    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
    });
  }, [chatId]);

  const send = async () => {
    if (!text) return;

    await addDoc(collection(db, "messages"), {
      chatId,
      senderId: user.uid,
      text,
      createdAt: serverTimestamp()
    });

    setText("");
  };

  return (
    <div style={s.page}>
      <div style={s.chat}>
        {messages.map((m,i)=>(
          <div key={i} style={{
            ...s.msg,
            alignSelf:m.senderId===user.uid?"flex-end":"flex-start"
          }}>
            {m.text}
          </div>
        ))}
      </div>

      <div style={s.inputRow}>
        <input value={text} onChange={e=>setText(e.target.value)} style={s.input}/>
        <button onClick={send} style={s.btn}>Send</button>
      </div>
    </div>
  );
}

const s={
  page:{height:"100vh",display:"flex",flexDirection:"column",background:"#020617",color:"white"},
  chat:{flex:1,padding:10,display:"flex",flexDirection:"column",gap:8},
  msg:{background:"#334155",padding:10,borderRadius:12,maxWidth:"70%"},
  inputRow:{display:"flex",padding:10},
  input:{flex:1,padding:10,background:"#1e293b",border:"none",color:"white"},
  btn:{background:"#7c3aed",padding:10,border:"none",color:"white"}
};