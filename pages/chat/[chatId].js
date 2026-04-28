import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // 🔐 AUTH + PAYMENT CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      setUser(u);

      // ✅ ADMIN BYPASS
      if (u.email === "admin@editbridge.com") {
        setAllowed(true);
        return;
      }

      // ✅ CHECK PAYMENT
      const accessRef = doc(db, "clientAccess", u.uid);
      const snap = await getDoc(accessRef);

      if (!snap.exists() || snap.data().status !== "approved") {
        alert("Payment required to chat");
        router.replace("/client");
        return;
      }

      setAllowed(true);
    });

    return () => unsub();
  }, []);

  // 💬 LOAD MESSAGES
  useEffect(() => {
    if (!chatId || !allowed) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsub();
  }, [chatId, allowed]);

  // 📩 SEND MESSAGE
  const send = async () => {
    if (!text.trim() || !user) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "chats", chatId),
      {
        lastMessage: text,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    setText("");
  };

  if (!allowed) return <p style={{ color: "white", padding: 20 }}>Checking access...</p>;

  return (
    <div style={s.page}>
      <div style={s.chatBox}>
        {messages.map((m) => {
          const isMe = m.sender === user.uid;
          return (
            <div
              key={m.id}
              style={{
                ...s.msg,
                alignSelf: isMe ? "flex-end" : "flex-start",
                background: isMe ? "#7c3aed" : "#334155",
              }}
            >
              {m.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={s.input}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} style={s.btn}>Send</button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    flexDirection: "column",
  },
  chatBox: {
    flex: 1,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",
  },
  msg: {
    padding: "8px 12px",
    borderRadius: 10,
    maxWidth: "70%",
    color: "white",
  },
  inputRow: {
    display: "flex",
    padding: 10,
    gap: 6,
    borderTop: "1px solid #333",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
  },
  btn: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
  },
};