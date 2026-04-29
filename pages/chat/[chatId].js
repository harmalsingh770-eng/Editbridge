"use client";

import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  doc, getDoc, collection, addDoc,
  onSnapshot, query, orderBy, updateDoc, setDoc, serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser]       = useState(null);
  const [chat, setChat]       = useState(null);
  const [msgs, setMsgs]       = useState([]);
  const [text, setText]       = useState("");
  const [isPaid, setIsPaid]   = useState(false);
  const [role, setRole]       = useState("client");
  const [loading, setLoading] = useState(true);
  const [showExit, setShowExit] = useState(false);
  const [otherName, setOtherName] = useState("Chat");

  const bottomRef = useRef(null);

  // ─── AUTH ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      setUser(u);
    });
    return () => unsub();
  }, []);

  // ─── LOAD CHAT + CHECK PAYMENT ─────────────────────────
  useEffect(() => {
    if (!chatId || !user) return;

    const loadChat = async () => {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (!snap.exists()) { setLoading(false); return; }

      const data = snap.data();
      setChat(data);

      // Determine role
      const editorId = data.editorId || chatId.split("_")[1];
      const isEditor = user.uid === editorId;
      setRole(isEditor ? "editor" : "client");

      // ✅ FIX: Editors NEVER need to pay
      if (isEditor) {
        setIsPaid(true);
        // get client name
        try {
          const cSnap = await getDoc(doc(db, "users", data.clientId));
          if (cSnap.exists()) setOtherName(cSnap.data().email || "Client");
        } catch {}
        setLoading(false);
        return;
      }

      // ✅ FIX: Check BOTH clientAccess AND chat.unlocked
      const accessSnap = await getDoc(doc(db, "clientAccess", chatId));
      const isApproved =
        (accessSnap.exists() && accessSnap.data().status === "approved") ||
        data.unlocked === true;

      setIsPaid(isApproved);

      // get editor name
      try {
        const eSnap = await getDoc(doc(db, "editors", editorId));
        if (eSnap.exists()) setOtherName(eSnap.data().name || "Editor");
      } catch {}

      setLoading(false);
    };

    loadChat();
  }, [chatId, user]);

  // ─── MESSAGES ───────────────────────────────────────────
  useEffect(() => {
    if (!chatId || !isPaid) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMsgs(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

      // mark seen
      data.forEach(async (m) => {
        if (m.sender !== user?.uid && !m.seen) {
          try {
            await updateDoc(doc(db, "chats", chatId, "messages", m.id), { seen: true });
          } catch {}
        }
      });
    });

    return () => unsub();
  }, [chatId, isPaid, user]);

  // ─── SEND ───────────────────────────────────────────────
  const send = async () => {
    if (!text.trim() || !user) return;
    const msg = text;
    setText("");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: msg,
      sender: user.uid,
      createdAt: serverTimestamp(),
      seen: false,
    });

    await setDoc(doc(db, "chats", chatId), {
      lastMessage: msg,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  };

  // ─── HELPERS ────────────────────────────────────────────
  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderText = (msg) => {
    const urlRe = /(https?:\/\/[^\s]+)/g;
    return msg.split(urlRe).map((part, i) =>
      urlRe.test(part)
        ? <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: "#93c5fd", textDecoration: "underline" }}>{part}</a>
        : part
    );
  };

  const handleBack = () => setShowExit(true);

  const confirmBack = () => {
    setShowExit(false);
    router.push(role === "editor" ? "/editor/inbox" : "/client");
  };

  // ─── LOADING ────────────────────────────────────────────
  if (loading || !user) return (
    <div style={s.loaderPage}>
      <style>{css}</style>
      <div style={s.spinner}></div>
    </div>
  );

  // ─── LOCK SCREEN (client only, not approved) ─────────────
  if (!isPaid && role === "client") return (
    <div style={s.lockPage}>
      <style>{css}</style>
      <div style={s.lockCard}>
        <div style={s.lockIcon}>🔒</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Chat Locked</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px", textAlign: "center" }}>
          Pay Rs.10 to unlock this chat with the editor
        </p>
        <button
          style={s.unlockBtn}
          onClick={() => router.push(`/pay/${chatId}`)}
        >
          Pay to Unlock
        </button>
        <button onClick={() => router.push("/client")} style={s.cancelBtn}>
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* EXIT CONFIRM MODAL */}
      {showExit && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 8px" }}>Leave Chat?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
              Are you sure you want to go back?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowExit(false)} style={s.mStay}>Stay</button>
              <button onClick={confirmBack} style={s.mLeave}>Yes, Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <button onClick={handleBack} style={s.backBtn}>Back</button>
        <div style={{ textAlign: "center" }}>
          <div style={s.headerName}>{otherName}</div>
          <div style={s.headerSub}>
            {role === "editor" ? "Client" : "Editor"}
          </div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* MESSAGES */}
      <div style={s.chat}>
        {msgs.length === 0 && (
          <div style={s.emptyChat}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <p style={{ color: "#475569", fontSize: 14 }}>Say hello to start!</p>
          </div>
        )}
        {msgs.map((m) => {
          const isMe = m.sender === user.uid;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: 6 }}>
              <div style={{
                ...s.bubble,
                background: isMe ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "#1e293b",
                borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              }}>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{renderText(m.text)}</div>
                <div style={s.meta}>
                  <span>{formatTime(m.createdAt)}</span>
                  {isMe && <span style={{ marginLeft: 4 }}>{m.seen ? "✓✓" : "✓"}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={s.input}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
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
  spinner: { width: 34, height: 34, border: "3px solid #333", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite" },

  lockPage: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)", color: "white", padding: 20, boxSizing: "border-box" },
  lockCard: { background: "#1e293b", borderRadius: 20, padding: 32, maxWidth: 340, width: "100%", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" },
  lockIcon: { fontSize: 52, marginBottom: 12 },
  unlockBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", color: "white", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10 },
  cancelBtn: { width: "100%", padding: 11, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 12, cursor: "pointer", fontSize: 14 },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#1e293b", borderRadius: 16, padding: 24, width: 280, textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" },
  mStay: { flex: 1, padding: "10px 16px", background: "#334155", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },
  mLeave: { flex: 1, padding: "10px 16px", background: "#7c3aed", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },

  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.95)" },
  backBtn: { background: "#1e293b", border: "none", color: "white", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  headerName: { fontWeight: 700, fontSize: 15 },
  headerSub: { color: "#94a3b8", fontSize: 11, marginTop: 2 },

  chat: { flex: 1, padding: "14px 12px", overflowY: "auto", display: "flex", flexDirection: "column" },
  emptyChat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60 },
  bubble: { padding: "10px 14px", maxWidth: "72%", color: "white", wordBreak: "break-word", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" },
  meta: { fontSize: 10, marginTop: 5, display: "flex", justifyContent: "flex-end", opacity: 0.7, gap: 2 },

  inputRow: { display: "flex", gap: 8, padding: "12px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.95)" },
  input: { flex: 1, padding: "12px 16px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", background: "#1e293b", color: "white", fontSize: 14, outline: "none" },
  sendBtn: { padding: "12px 20px", background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", color: "white", borderRadius: 24, fontWeight: 700, cursor: "pointer", fontSize: 14 },
};