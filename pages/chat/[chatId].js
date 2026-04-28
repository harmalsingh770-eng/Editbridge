"use client";

import { useEffect, useState, useRef } from "react";
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
  const [role, setRole] = useState("client");

  const user = auth.currentUser;
  const bottomRef = useRef();

  // 🔐 PAYMENT LOGIC (CLIENT ONLY)
  useEffect(() => {
    if (!chatId || !user) return;

    const [clientId, editorId] = chatId.split("_");

    if (user.uid === editorId) {
      setIsPaid(true);
      setRole("editor");
      return;
    }

    setRole("client");

    const q = query(
      collection(db, "paymentRequests"),
      where("chatId", "==", chatId),
      where("uid", "==", user.uid),
      where("status", "==", "approved")
    );

    return onSnapshot(q, snap => {
      setIsPaid(!snap.empty);
    });
  }, [chatId, user]);

  // 💬 MESSAGES
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId)
    );

    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [chatId]);

  // 💼 DEALS
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

  // ✉️ SEND MESSAGE
  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "messages"), {
      chatId,
      senderId: user.uid,
      text,
      createdAt: serverTimestamp()
    });

    setText("");
  };

  // 💰 SEND DEAL (CLIENT ONLY)
  const sendDeal = async () => {
    if (role !== "client") return;

    const price = prompt("Enter deal price");
    if (!price) return;

    await addDoc(collection(db, "deals"), {
      chatId,
      clientId: user.uid,
      editorId: chatId.split("_")[1],
      price: Number(price),
      status: "pending",
      createdAt: serverTimestamp()
    });
  };

  // 🔁 COUNTER OFFER (EDITOR)
  const counterDeal = async () => {
    const newPrice = prompt("Enter counter price");
    if (!newPrice) return;

    await updateDoc(doc(db, "deals", deal.id), {
      price: Number(newPrice),
      status: "countered"
    });
  };

  // ❌ REJECT DEAL
  const rejectDeal = async () => {
    await updateDoc(doc(db, "deals", deal.id), {
      status: "rejected"
    });
  };

  // ✅ ACCEPT DEAL + CREATE PAYMENT (EDITOR)
  const acceptDeal = async () => {
    if (!confirm("Accept this deal?")) return;
    if (!confirm("Final confirmation?")) return;

    await updateDoc(doc(db, "deals", deal.id), {
      status: "accepted"
    });

    const commission = Math.floor(deal.price * 0.1);

    // 💸 CREATE EDITOR PAYMENT REQUEST
    await addDoc(collection(db, "editorPayments"), {
      editorId: user.uid,
      chatId,
      dealId: deal.id,
      totalAmount: deal.price,
      commission: commission,
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert(`Deal accepted ✅\nYou must pay ₹${commission} to platform`);
  };

  // 🔒 LOCK SCREEN
  if (!isPaid) {
    return (
      <div style={s.lockPage}>
        <h2>🔒 Chat Locked</h2>
        <p>Pay ₹10 to unlock chat</p>
        <button
          style={s.unlockBtn}
          onClick={() => router.push(`/pay/${chatId.split("_")[1]}`)}
        >
          Unlock Chat
        </button>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* 💬 CHAT */}
      <div style={s.chatBox}>
        {messages.map(m => {
          const isMe = m.senderId === user.uid;
          return (
            <div key={m.id} style={{
              ...s.msg,
              alignSelf: isMe ? "flex-end" : "flex-start",
              background: isMe ? "#7c3aed" : "#334155"
            }}>
              {m.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 💼 DEAL BOX */}
      {deal && (
        <div style={s.dealBox}>
          <div>
            💼 ₹{deal.price} • {deal.status}
          </div>

          {role === "editor" && deal.status === "pending" && (
            <>
              <button onClick={acceptDeal} style={s.green}>Accept</button>
              <button onClick={counterDeal} style={s.blue}>Counter</button>
              <button onClick={rejectDeal} style={s.red}>Reject</button>
            </>
          )}

          {role === "client" && deal.status === "countered" && (
            <>
              <button onClick={acceptDeal} style={s.green}>Accept</button>
              <button onClick={rejectDeal} style={s.red}>Reject</button>
            </>
          )}
        </div>
      )}

      {/* ➕ SEND DEAL */}
      {role === "client" && (
        <button onClick={sendDeal} style={s.dealBtn}>
          Send Deal
        </button>
      )}

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type message..."
          style={s.input}
        />
        <button onClick={send} style={s.sendBtn}>Send</button>
      </div>

    </div>
  );
}

const s = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  chatBox: {
    flex: 1,
    padding: 15,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto"
  },

  msg: {
    padding: "10px 14px",
    borderRadius: 12,
    maxWidth: "70%"
  },

  inputRow: {
    display: "flex",
    padding: 10,
    gap: 8
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#1e293b",
    color: "white"
  },

  sendBtn: {
    padding: "10px 18px",
    background: "#7c3aed",
    border: "none",
    borderRadius: 10,
    color: "white"
  },

  dealBox: {
    padding: 12,
    background: "#1e293b",
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center"
  },

  dealBtn: {
    margin: 10,
    padding: 10,
    background: "#6366f1",
    border: "none",
    borderRadius: 10,
    color: "white"
  },

  green: { background: "#10b981", border: "none", padding: "6px 10px", borderRadius: 8, color: "white" },
  red: { background: "#ef4444", border: "none", padding: "6px 10px", borderRadius: 8, color: "white" },
  blue: { background: "#3b82f6", border: "none", padding: "6px 10px", borderRadius: 8, color: "white" },

  lockPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    background: "#020617",
    color: "white"
  },

  unlockBtn: {
    marginTop: 12,
    padding: "12px 20px",
    background: "#7c3aed",
    border: "none",
    borderRadius: 10,
    color: "white"
  }
};