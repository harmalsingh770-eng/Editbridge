"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc
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

  // 🔒 Check payment
  useEffect(() => {
    if (!chatId || !user) return;

    const q = query(
      collection(db, "paymentRequests"),
      where("chatId", "==", chatId),
      where("uid", "==", user.uid),
      where("status", "==", "approved")
    );

    return onSnapshot(q, (snap) => {
      setIsPaid(!snap.empty);
    });
  }, [chatId]);

  // 💬 messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId)
    );

    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => d.data()));
    });
  }, [chatId]);

  // 💼 deal
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "deals"),
      where("chatId", "==", chatId)
    );

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setDeal({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });
  }, [chatId]);

  // send msg
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

  // 🔥 deal send
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

  // accept deal
  const acceptDeal = async () => {
    if (!confirm("Accept?")) return;
    if (!confirm("Final confirm?")) return;

    await updateDoc(doc(db, "deals", deal.id), {
      status: "accepted"
    });
  };

  if (!isPaid) {
    return (
      <div>
        <h2>🔒 Pay to unlock chat</h2>
        <button onClick={() => router.push(`/pay/${chatId.split("_")[1]}`)}>
          Pay ₹10
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Chat</h2>

      {deal && (
        <div>
          Deal: ₹{deal.price} ({deal.status})
          <button onClick={acceptDeal}>Accept</button>
        </div>
      )}

      <button onClick={sendDeal}>Send Deal</button>

      {messages.map((m, i) => (
        <p key={i}>{m.text}</p>
      ))}

      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}