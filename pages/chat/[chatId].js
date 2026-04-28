"use client";

import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [otherName, setOtherName] = useState("Chat");
  const [loading, setLoading] = useState(true);
  const [showExit, setShowExit] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");
      setUser(u);

      // Check role
      const edSnap = await getDoc(doc(db, "editors", u.uid));
      if (edSnap.exists()) setUserRole("editor");
      else setUserRole("client");
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!chatId || !user) return;

    // Get other person name
    const fetchOther = async () => {
      const chatSnap = await getDoc(doc(db, "chats", chatId));
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        const otherUid = data.users?.find(id => id !== user.uid);
        if (otherUid) {
          const edSnap = await getDoc(doc(db, "editors", otherUid));
          if (edSnap.exists()) return setOtherName(edSnap.data().name || "Editor");
          const uSnap = await getDoc(doc(db, "users", otherUid));
          if (uSnap.exists()) return setOtherName(uSnap.data().email || "Client");
          setOtherName("Admin");
        }
      }
    };
    fetchOther();

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsub();
  }, [chatId, user]);

  const send = async () => {
    if (!text.trim() || !user || !chatId) return;
    const msg = text;
    setText("");

    await setDoc(doc(db, "chats", chatId), {
      users: chatId.split("_"),
      lastMessage: msg,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: msg,
      sender: user.uid,
      senderEmail: user.email,
      createdAt: serverTimestamp()
    });
  };

  const handleBack = () => setShowExit(true);

  const confirmBack = () => {
    setShowExit(false);
    if (userRole === "editor") router.push("/editor/inbox");
    else router.push("/client");
  };

  if (loading || !user) return (
    <div style={s.loaderPage}>
      <style>{css}</style>
      <div style={s.spinner}></div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* EXIT MODAL */}
      {showExit && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 8px" }}>Leave Chat?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
              Are you sure you want to go back?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowExit(false)} style={s.mCancel}>Stay</button>
              <button onClick={confirmBack} style={s.mConfirm}>Yes, Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <button onClick={handleBack} style={s.backBtn}>Back</button>
        <div style={{ textAlign: "center" }}>
          <div style={s.headerName}>{otherName}</div>
          <div style={s.headerSub}>Active now</div>
        </div>
        <div style={{ width: 50 }} />
      </div>

      {/* MESSAGES */}
      <div style={s.chatBox}>
        {messages.length === 0 && (
          <div style={s.emptyChat}>
            <div style={s.emptyIcon}>💬</div>
            <p>Say hello to start the conversation!</p>
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.sender === user.uid;
          const time = m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: 4 }}>
              <div style={{
                ...s.msg,
                background: isMe
                  ? "linear-gradient(135deg,#7c3aed,#6366f1)"
                  : "#1e293b",
                borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              }}>
                {m.text}
              </div>
              {time && <div style={s.time}>{time}</div>}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message..."
          style={s.input}
        />
        <button onClick={send} style={s.sendBtn} disabled={!text.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

const css = `
  body { margin: 0; font-family: sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)", color: "white", overflow: "hidden" },
  loaderPage: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#020617" },
  spinner: { width: 32, height: 32, border: "3px solid #333", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#1e293b", borderRadius: 16, padding: 24, width: 280, textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" },
  mCancel: { flex: 1, padding: "10px 16px", background: "#334155", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },
  mConfirm: { flex: 1, padding: "10px 16px", background: "#7c3aed", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },

  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)" },
  backBtn: { background: "#1e293b", border: "none", color: "white", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  headerName: { fontWeight: 700, fontSize: 15 },
  headerSub: { color: "#22c55e", fontSize: 11, marginTop: 2 },

  chatBox: { flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column" },
  emptyChat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569", textAlign: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },

  msg: { padding: "10px 14px", maxWidth: "72%", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word", color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  time: { fontSize: 10, color: "#475569", marginTop: 3, marginBottom: 4, paddingLeft: 4, paddingRight: 4 },

  inputRow: { display: "flex", gap: 8, padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.9)", backdropFilter: "blur(10px)" },
  input: { flex: 1, padding: "12px 16px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", background: "#1e293b", color: "white", fontSize: 14, outline: "none" },
  sendBtn: { padding: "12px 20px", background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", color: "white", borderRadius: 24, fontWeight: 700, cursor: "pointer", fontSize: 14 },
};