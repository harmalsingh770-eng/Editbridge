"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [deal, setDeal] = useState(null);

  const bottomRef = useRef(null);
  const user = auth.currentUser;

  // 🔐 PAYWALL
  useEffect(() => {
    if (!chatId || !user) return;

    const ref = doc(db, "clientAccess", chatId);

    getDoc(ref).then(snap => {
      if (snap.exists() && snap.data().status === "approved") {
        setIsPaid(true);
      }
    });
  }, [chatId]);

  // 💬 MESSAGES + 👁 SEEN TICKS
  useEffect(() => {
    if (!chatId || !user) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);

      // MARK AS SEEN
      msgs.forEach(async (m) => {
        if (m.sender !== user.uid && !m.seenBy?.includes(user.uid)) {
          await updateDoc(doc(db, "chats", chatId, "messages", m.id), {
            seenBy: [...(m.seenBy || []), user.uid]
          });
        }
      });

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [chatId]);

  // 💰 DEAL SYSTEM
  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, "deals"), orderBy("createdAt"));

    return onSnapshot(q, snap => {
      const d = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find(x => x.chatId === chatId);

      setDeal(d || null);
    });
  }, [chatId]);

  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      seenBy: [user.uid],
      createdAt: serverTimestamp()
    });

    setText("");
  };

  const createDeal = async () => {
    const price = prompt("Enter deal amount ₹");
    if (!price) return;

    await addDoc(collection(db, "deals"), {
      chatId,
      createdBy: user.uid,
      price: Number(price),
      status: "pending",
      createdAt: serverTimestamp()
    });
  };

  const acceptDeal = async () => {
    if (!confirm("Accept deal?")) return;

    await updateDoc(doc(db, "deals", deal.id), {
      status: "accepted"
    });
  };

  const rejectDeal = async () => {
    if (!confirm("Reject deal?")) return;

    await updateDoc(doc(db, "deals", deal.id), {
      status: "rejected"
    });
  };

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

      {/* HEADER */}
      <div style={s.header}>
        <h3>💬 Chat</h3>
      </div>

      {/* MESSAGES */}
      <div style={s.chat}>
        {messages.map(m => {
          const me = m.sender === user.uid;
          const seenCount = m.seenBy?.length || 0;

          let ticks = "✓";
          if (seenCount >= 2) ticks = "✓✓";

          return (
            <div
              key={m.id}
              style={{
                ...s.msg,
                alignSelf: me ? "flex-end" : "flex-start",
                background: me
                  ? "linear-gradient(135deg,#7c3aed,#6366f1)"
                  : "#1e293b"
              }}
            >
              <div>{m.text}</div>

              {me && (
                <div style={{
                  fontSize: 10,
                  marginTop: 4,
                  textAlign: "right",
                  color: seenCount >= 2 ? "#38bdf8" : "#94a3b8"
                }}>
                  {ticks}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* DEAL */}
      {deal && (
        <div style={s.dealBox}>
          💰 ₹{deal.price} — {deal.status}

          {deal.status === "pending" && (
            <div style={{ marginTop: 6 }}>
              <button onClick={acceptDeal} style={s.accept}>Accept</button>
              <button onClick={rejectDeal} style={s.reject}>Reject</button>
            </div>
          )}
        </div>
      )}

      <button onClick={createDeal} style={s.dealBtn}>
        💰 Create Deal
      </button>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type message..."
          style={s.input}
        />
        <button onClick={send} style={s.send}>Send</button>
      </div>

    </div>
  );
}

const s = {
  page:{
    height:"100vh",
    display:"flex",
    flexDirection:"column",
    background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color:"white"
  },

  header:{
    padding:14,
    borderBottom:"1px solid rgba(255,255,255,0.08)"
  },

  chat:{
    flex:1,
    padding:12,
    display:"flex",
    flexDirection:"column",
    gap:10,
    overflowY:"auto"
  },

  msg:{
    padding:"10px 14px",
    borderRadius:14,
    maxWidth:"75%",
    fontSize:14
  },

  dealBox:{
    margin:10,
    padding:12,
    borderRadius:12,
    background:"#1e293b",
    textAlign:"center"
  },

  dealBtn:{
    margin:"0 10px",
    padding:10,
    borderRadius:10,
    background:"#f59e0b",
    border:"none",
    color:"white"
  },

  accept:{
    marginRight:6,
    background:"#10b981",
    border:"none",
    padding:"6px 10px",
    borderRadius:8,
    color:"white"
  },

  reject:{
    background:"#ef4444",
    border:"none",
    padding:"6px 10px",
    borderRadius:8,
    color:"white"
  },

  inputRow:{
    display:"flex",
    gap:8,
    padding:10
  },

  input:{
    flex:1,
    padding:10,
    borderRadius:10,
    background:"#1e293b",
    border:"none",
    color:"white"
  },

  send:{
    padding:"10px 16px",
    background:"#7c3aed",
    border:"none",
    borderRadius:10,
    color:"white"
  },

  lock:{
    height:"100vh",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    flexDirection:"column"
  }
};