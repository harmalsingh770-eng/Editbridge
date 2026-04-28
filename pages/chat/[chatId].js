"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection, addDoc, query, where,
  onSnapshot, serverTimestamp, updateDoc, doc
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [deal, setDeal] = useState(null);

  const user = auth.currentUser;

  // 🔥 FIXED PAYMENT LOGIC
  useEffect(() => {
    if (!chatId || !user) return;

    const [clientId, editorId] = chatId.split("_");

    if (user.uid === editorId) {
      setIsPaid(true);
      return;
    }

    const q = query(
      collection(db, "paymentRequests"),
      where("chatId", "==", chatId),
      where("uid", "==", user.uid),
      where("status", "==", "approved")
    );

    return onSnapshot(q, snap => {
      setIsPaid(!snap.empty);
    });
  }, [chatId]);

  // messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, "messages"), where("chatId", "==", chatId));

    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
    });
  }, [chatId]);

  // deals
  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, "deals"), where("chatId", "==", chatId));

    return onSnapshot(q, snap => {
      if (!snap.empty) {
        setDeal({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
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

  const sendDeal = async () => {
    const price = prompt("Enter deal price");
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
    if (!confirm("Confirm?")) return;
    if (!confirm("Final confirm?")) return;

    await updateDoc(doc(db, "deals", deal.id), {
      status: "accepted"
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

      <div style={s.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{
            ...s.msg,
            alignSelf: m.senderId === user.uid ? "flex-end" : "flex-start"
          }}>
            {m.text}
          </div>
        ))}
      </div>

      {deal && (
        <div style={s.deal}>
          ₹{deal.price} ({deal.status})
          <button onClick={acceptDeal}>Accept</button>
        </div>
      )}

      <button onClick={sendDeal}>Send Deal</button>

      <div style={s.inputRow}>
        <input value={text} onChange={e => setText(e.target.value)} />
        <button onClick={send}>Send</button>
      </div>

    </div>
  );
}

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#020617", color: "white" },
  chatBox: { flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 8 },
  msg: { padding: 10, borderRadius: 10, background: "#334155", maxWidth: "70%" },
  inputRow: { display: "flex", padding: 10 },
  deal: { padding: 10, background: "#1e293b" },
  lock: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }
};