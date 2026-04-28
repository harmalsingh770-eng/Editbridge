import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [deal, setDeal] = useState(null);

  const bottomRef = useRef();

  const user = auth.currentUser;

  // 🔄 LOAD CHAT
  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);

    const unsubChat = onSnapshot(chatRef, (snap) => {
      const data = snap.data();
      setDeal(data?.deal || null);

      // typing indicator
      if (data?.typing && data.typing !== user?.uid) {
        setOtherTyping(true);
      } else {
        setOtherTyping(false);
      }
    });

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsubMsg = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => {
      unsubChat();
      unsubMsg();
    };
  }, [chatId]);

  // 💬 SEND MESSAGE
  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      seen: false,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      typing: null
    }, { merge: true });

    setText("");
  };

  // 👁️ SEEN
  useEffect(() => {
    messages.forEach(async (m) => {
      if (!m.seen && m.sender !== user?.uid) {
        await updateDoc(doc(db, "chats", chatId, "messages", m.id), {
          seen: true
        });
      }
    });
  }, [messages]);

  // ⌨️ TYPING
  const handleTyping = async (val) => {
    setText(val);

    await setDoc(doc(db, "chats", chatId), {
      typing: user.uid
    }, { merge: true });

    setTimeout(() => {
      setDoc(doc(db, "chats", chatId), {
        typing: null
      }, { merge: true });
    }, 1000);
  };

  // 💼 CREATE DEAL
  const createDeal = async () => {
    const amount = prompt("Enter deal amount ₹");
    if (!amount) return;

    await setDoc(doc(db, "chats", chatId), {
      deal: {
        amount: Number(amount),
        status: "pending",
        createdBy: user.uid
      }
    }, { merge: true });
  };

  // ✅ ACCEPT DEAL
  const acceptDeal = async () => {
    await updateDoc(doc(db, "chats", chatId), {
      "deal.status": "accepted"
    });
  };

  // 🎉 COMPLETE DEAL
  const completeDeal = async () => {
    await updateDoc(doc(db, "chats", chatId), {
      "deal.status": "completed"
    });
  };

  return (
    <div style={s.page}>
      
      {/* DEAL CARD */}
      {deal && (
        <div style={s.dealBox}>
          <div>💼 Deal: ₹{deal.amount}</div>
          <div>Status: {deal.status}</div>

          {deal.status === "pending" && (
            <button onClick={acceptDeal}>Accept</button>
          )}

          {deal.status === "accepted" && (
            <button onClick={completeDeal}>Mark Completed</button>
          )}

          {deal.status === "completed" && (
            <div>
              ✅ Completed <br />
              💰 Editor gets ₹{Math.floor(deal.amount * 0.9)} <br />
              🏢 Platform gets ₹{Math.floor(deal.amount * 0.1)}
            </div>
          )}
        </div>
      )}

      {/* CHAT */}
      <div style={s.chat}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              ...s.msg,
              alignSelf: m.sender === user.uid ? "flex-end" : "flex-start"
            }}
          >
            {m.text}
            <div style={s.meta}>
              {m.seen ? "✔✔" : "✔"}
            </div>
          </div>
        ))}

        {otherTyping && <div style={s.typing}>Typing...</div>}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          style={s.input}
        />
        <button onClick={send}>Send</button>
        <button onClick={createDeal}>💼 Deal</button>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#020617", color: "white" },
  chat: { flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 8 },
  msg: { background: "#334155", padding: 10, borderRadius: 10, maxWidth: "70%" },
  meta: { fontSize: 10, opacity: 0.6, marginTop: 4 },
  typing: { fontSize: 12, opacity: 0.7 },
  inputRow: { display: "flex", gap: 6, padding: 10 },
  input: { flex: 1, padding: 10 },
  dealBox: { padding: 10, background: "#1e293b", margin: 10, borderRadius: 10 }
};