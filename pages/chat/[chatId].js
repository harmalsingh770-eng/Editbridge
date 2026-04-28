"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection, addDoc, query, orderBy, where,
  onSnapshot, serverTimestamp, doc, getDoc, updateDoc
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);

  const bottomRef = useRef(null);
  const user = auth.currentUser;

  // 🔐 PAYWALL
  useEffect(() => {
    if (!chatId || !user) return;

    const [clientId, editorId] = chatId.split("_");

    if (user.uid === editorId) {
      setIsPaid(true);
      setLoading(false);
      return;
    }

    getDoc(doc(db, "clientAccess", chatId)).then(snap => {
      setIsPaid(snap.exists() && snap.data().status === "approved");
      setLoading(false);
    });
  }, [chatId]);

  // 💬 MESSAGES
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

  // 💼 DEAL
  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, "deals"), where("chatId", "==", chatId));

    return onSnapshot(q, snap => {
      if (!snap.empty) {
        setDeal({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setDeal(null);
      }
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

  const sendDeal = async () => {
    const price = prompt("Enter price");
    if (!price) return;

    await addDoc(collection(db, "deals"), {
      chatId,
      clientId: user.uid,
      price: Number(price),
      status: "pending",
      createdAt: serverTimestamp()
    });
  };

  const acceptDeal = async () => {
    if (!confirm("Accept?")) return;
    if (!confirm("Final confirm?")) return;

    await updateDoc(doc(db, "deals", deal.id), {
      status: "accepted"
    });
  };

  const rejectDeal = async () => {
    await updateDoc(doc(db, "deals", deal.id), {
      status: "rejected"
    });
  };

  const counterDeal = async () => {
    const price = prompt("Counter price");
    if (!price) return;

    await updateDoc(doc(db, "deals", deal.id), {
      price: Number(price),
      status: "counter"
    });
  };

  if (loading) return <div style={s.loader}>Loading...</div>;

  if (!isPaid) {
    return (
      <div style={s.lock}>
        <h2>🔒 Chat Locked</h2>
        <button onClick={() => router.push(`/pay/${chatId.split("_")[1]}`)}>
          Unlock Chat
        </button>
      </div>
    );
  }

  return (
    <div style={s.page}>

      <div style={s.header}>
        <button onClick={() => router.back()}>←</button>
        <h3>Chat</h3>
      </div>

      {deal && (
        <div style={s.dealBox}>
          <b>₹{deal.price}</b> ({deal.status})
          {deal.status === "pending" && (
            <>
              <button onClick={acceptDeal}>Accept</button>
              <button onClick={rejectDeal}>Reject</button>
              <button onClick={counterDeal}>Counter</button>
            </>
          )}
        </div>
      )}

      <button onClick={sendDeal} style={s.dealBtn}>Send Deal</button>

      <div style={s.chat}>
        {messages.map(m => (
          <div key={m.id} style={{
            ...s.msg,
            alignSelf: m.sender === user.uid ? "flex-end" : "flex-start"
          }}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      <div style={s.inputRow}>
        <input value={text} onChange={e => setText(e.target.value)} />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

const s = {
  page:{height:"100vh",display:"flex",flexDirection:"column",background:"#020617",color:"white"},
  header:{display:"flex",gap:10,padding:10,borderBottom:"1px solid #333"},
  chat:{flex:1,padding:10,display:"flex",flexDirection:"column",gap:8},
  msg:{padding:10,borderRadius:10,background:"#1e293b",maxWidth:"70%"},
  inputRow:{display:"flex",padding:10,gap:8},
  dealBox:{background:"#1e293b",padding:10,margin:10,borderRadius:10},
  dealBtn:{margin:10,padding:10,background:"#7c3aed",border:"none",color:"white"},
  lock:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center",flexDirection:"column"},
  loader:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"}
};