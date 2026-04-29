"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, onSnapshot, updateDoc, doc, setDoc,
  getDoc, addDoc, query, orderBy, serverTimestamp, deleteDoc
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();

  const [tab, setTab]             = useState("payments");
  const [payments, setPayments]   = useState([]);
  const [editors, setEditors]     = useState([]);
  const [users, setUsers]         = useState([]);
  const [allChats, setAllChats]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showLogout, setShowLogout] = useState(false);

  // Chat panel
  const [chatOpen, setChatOpen]     = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [msgText, setMsgText]       = useState("");

  const adminUidRef   = useRef(null);
  const unsubChatRef  = useRef(null);
  const unsubsRef     = useRef([]);
  const bottomRef     = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");
      adminUidRef.current = u.uid;

      const u1 = onSnapshot(collection(db, "paymentRequests"), snap => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      const u2 = onSnapshot(collection(db, "editors"), snap =>
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      const u3 = onSnapshot(collection(db, "users"), snap =>
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      const u4 = onSnapshot(collection(db, "chats"), snap =>
        setAllChats(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

      unsubsRef.current = [u1, u2, u3, u4];
    });

    return () => {
      unsubAuth();
      unsubsRef.current.forEach(fn => fn?.());
      if (unsubChatRef.current) unsubChatRef.current();
    };
  }, []);

  // ─── OPEN ADMIN CHAT ──────────────────────────────────
  const openChat = async (targetUid, name) => {
    const myUid = adminUidRef.current;
    if (!myUid) return;
    const chatId = [myUid, targetUid].sort().join("_");

    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        users: [myUid, targetUid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      });
    }

    setChatTarget({ chatId, name });
    setChatOpen(true);

    if (unsubChatRef.current) unsubChatRef.current();
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    unsubChatRef.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
    });
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatTarget(null);
    setMessages([]);
    if (unsubChatRef.current) unsubChatRef.current();
  };

  const sendMsg = async () => {
    if (!msgText.trim()) return;
    const msg = msgText;
    setMsgText("");
    await addDoc(collection(db, "chats", chatTarget.chatId, "messages"), {
      text: msg, sender: adminUidRef.current, createdAt: serverTimestamp()
    });
    await setDoc(doc(db, "chats", chatTarget.chatId),
      { lastMessage: msg, lastUpdated: serverTimestamp() }, { merge: true });
  };

  // ─── PAYMENT ACTIONS ──────────────────────────────────
  // ✅ KEY FIX: Now sets BOTH clientAccess AND chat.unlocked = true
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "approved" });

    // Write clientAccess so chat.js can check it
    await setDoc(doc(db, "clientAccess", p.chatId), {
      uid: p.uid,
      editorId: p.editorId,
      chatId: p.chatId,
      status: "approved",
    });

    // Also set chat.unlocked = true directly so old check also works
    try {
      await updateDoc(doc(db, "chats", p.chatId), { unlocked: true });
    } catch {}
  };

  const rejectPayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "rejected" });
  };

  const approveEditor = async (id) =>
    await updateDoc(doc(db, "editors", id), { approved: true, active: true });

  const deleteEditor = async (id) => {
    if (!confirm("Delete editor?")) return;
    await deleteDoc(doc(db, "editors", id));
  };

  const confirmLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return (
    <div style={s.loaderPage}>
      <style>{css}</style>
      <div style={s.spinner}></div>
    </div>
  );

  const pending = payments.filter(p => p.status === "pending");
  const filteredPayments = payments
    .filter(p => (p.email || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.status === "pending" ? -1 : 1);
  const filteredEditors = editors
    .filter(e => (e.name || "").toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users
    .filter(u => (u.email || "").toLowerCase().includes(search.toLowerCase()));

  const tabs = ["payments", "editors", "users", "messages"];

  return (
    <>
      <style>{css}</style>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 8px" }}>Logout?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
              Do you really want to logout?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogout(false)} style={s.mCancel}>Stay</button>
              <button onClick={confirmLogout} style={s.mConfirm}>Logout</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.page}>

        {/* HEADER */}
        <div style={s.header}>
          <span style={s.logo}>Admin Panel</span>
          <button onClick={() => setShowLogout(true)} style={s.btnRed}>Logout</button>
        </div>

        {/* STATS */}
        <div style={s.stats}>
          <Stat label="Payments" value={payments.length} color="#7c3aed" />
          <Stat label="Pending" value={pending.length} color="#f59e0b" />
          <Stat label="Editors" value={editors.length} color="#6366f1" />
          <Stat label="Users" value={users.length} color="#10b981" />
        </div>

        {/* SEARCH */}
        <div style={{ padding: "0 16px 12px" }}>
          <input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={tab === t ? s.tabActive : s.tab}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "payments" && pending.length > 0 &&
                <span style={s.badge}>{pending.length}</span>}
            </button>
          ))}
        </div>

        <div style={s.content}>

          {/* PAYMENTS */}
          {tab === "payments" && (
            filteredPayments.length === 0
              ? <Empty text="No payments yet" />
              : filteredPayments.map(p => (
                <div key={p.id} style={s.card}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cardTitle}>{p.email || "Unknown"}</div>
                    <div style={s.cardSub}>Txn: {p.txnId || "—"}</div>
                    <div style={s.cardSub}>Chat: {p.chatId?.slice(0, 16) || "—"}</div>
                  </div>
                  <div style={s.actions}>
                    <span style={badge(p.status)}>{p.status || "pending"}</span>
                    {(!p.status || p.status === "pending") && (
                      <>
                        <button onClick={() => approvePayment(p)} style={s.btnGreen}>Approve</button>
                        <button onClick={() => rejectPayment(p)} style={s.btnRed2}>Reject</button>
                      </>
                    )}
                    <button onClick={() => openChat(p.uid, p.email || "Client")} style={s.btnPurple}>Chat</button>
                  </div>
                </div>
              ))
          )}

          {/* EDITORS */}
          {tab === "editors" && (
            filteredEditors.length === 0
              ? <Empty text="No editors yet" />
              : filteredEditors.map(e => (
                <div key={e.id} style={s.card}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cardTitle}>{e.name || "Unnamed"}</div>
                    <div style={s.cardSub}>{e.email}</div>
                    <div style={s.cardSub}>Skills: {e.skills?.join(", ") || "—"}</div>
                  </div>
                  <div style={s.actions}>
                    <span style={badge(e.approved ? "approved" : "pending")}>
                      {e.approved ? "approved" : "pending"}
                    </span>
                    {!e.approved &&
                      <button onClick={() => approveEditor(e.id)} style={s.btnGreen}>Approve</button>}
                    <button onClick={() => openChat(e.id, e.name || "Editor")} style={s.btnPurple}>Chat</button>
                    <button onClick={() => deleteEditor(e.id)} style={s.btnRed2}>Del</button>
                  </div>
                </div>
              ))
          )}

          {/* USERS */}
          {tab === "users" && (
            filteredUsers.length === 0
              ? <Empty text="No users yet" />
              : filteredUsers.map(u => (
                <div key={u.id} style={s.card}>
                  <div style={{ flex: 1 }}>
                    <div style={s.cardTitle}>{u.email}</div>
                    <div style={s.cardSub}>Role: {u.role || "client"}</div>
                  </div>
                  <button onClick={() => openChat(u.id, u.email)} style={s.btnPurple}>Chat</button>
                </div>
              ))
          )}

          {/* MESSAGES */}
          {tab === "messages" && (
            allChats.length === 0
              ? <Empty text="No chats yet" />
              : allChats.map(c => (
                <div key={c.id} style={s.card}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cardTitle}>Chat Room</div>
                    <div style={s.cardSub}>ID: {c.id?.slice(0, 20)}</div>
                    <div style={s.cardSub}>Last: {c.lastMessage || "—"}</div>
                  </div>
                  <div style={s.actions}>
                    <span style={badge(c.unlocked ? "approved" : "pending")}>
                      {c.unlocked ? "unlocked" : "locked"}
                    </span>
                    <button onClick={() => router.push("/chat/" + c.id)} style={s.btnPurple}>Open</button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={s.chatPanel}>
          <div style={s.chatPanelHeader}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{chatTarget?.name}</span>
            <button onClick={closeChat} style={s.closeBtn}>X</button>
          </div>
          <div style={s.chatMessages}>
            {messages.length === 0 &&
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center", marginTop: 16 }}>No messages yet</p>}
            {messages.map(m => {
              const isMe = m.sender === adminUidRef.current;
              return (
                <div key={m.id} style={{
                  ...s.chatBubble,
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  background: isMe ? "#7c3aed" : "#334155",
                }}>
                  {m.text}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={s.chatInputRow}>
            <input
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMsg(); }}
              placeholder="Type message..."
              style={s.chatInput}
            />
            <button onClick={sendMsg} style={s.chatSend}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 70, background: "#1e293b", padding: "12px 10px", borderRadius: 12, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Empty({ text }) {
  return <p style={{ color: "#475569", textAlign: "center", marginTop: 30, fontSize: 14 }}>{text}</p>;
}

const badge = (status) => ({
  padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "white",
  background: status === "approved" ? "#10b981" : status === "rejected" ? "#ef4444" : "#f59e0b",
});

const css = `
  body { margin: 0; font-family: sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)", color: "white", paddingBottom: 80 },
  loaderPage: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#020617" },
  spinner: { width: 36, height: 36, border: "3px solid #333", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 },
  modal: { background: "#1e293b", borderRadius: 16, padding: 24, width: 280, textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" },
  mCancel: { flex: 1, padding: "10px 16px", background: "#334155", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },
  mConfirm: { flex: 1, padding: "10px 16px", background: "#ef4444", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  logo: { fontWeight: 800, fontSize: 17 },
  btnRed: { background: "#ef4444", color: "white", padding: "8px 14px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },

  stats: { display: "flex", gap: 8, padding: 16, flexWrap: "wrap" },

  searchInput: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "none", background: "#1e293b", color: "white", outline: "none", boxSizing: "border-box", fontSize: 14 },

  tabs: { display: "flex", gap: 6, padding: "0 16px 14px", flexWrap: "wrap" },
  tab: { flex: 1, minWidth: 70, padding: "9px 6px", background: "#1e293b", border: "none", color: "#94a3b8", borderRadius: 8, cursor: "pointer", fontSize: 12, position: "relative" },
  tabActive: { flex: 1, minWidth: 70, padding: "9px 6px", background: "#7c3aed", border: "none", color: "white", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, position: "relative" },
  badge: { position: "absolute", top: -6, right: -6, background: "#ef4444", color: "white", borderRadius: "50%", fontSize: 10, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },

  content: { padding: "0 16px" },
  card: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px", background: "#1e293b", marginBottom: 10, borderRadius: 14, flexWrap: "wrap", gap: 10, border: "1px solid rgba(255,255,255,0.04)" },
  cardTitle: { fontWeight: 600, fontSize: 14, marginBottom: 3 },
  cardSub: { fontSize: 12, color: "#94a3b8", marginBottom: 2 },
  actions: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },

  btnGreen: { background: "#10b981", color: "white", padding: "6px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  btnRed2: { background: "#ef4444", color: "white", padding: "6px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  btnPurple: { background: "#7c3aed", color: "white", padding: "6px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 },

  chatPanel: { position: "fixed", bottom: 0, right: 0, width: "min(340px,100vw)", height: 420, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px 16px 0 0", display: "flex", flexDirection: "column", zIndex: 200, boxShadow: "0 -4px 30px rgba(0,0,0,0.5)" },
  chatPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  closeBtn: { background: "#334155", border: "none", color: "white", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  chatMessages: { flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 },
  chatBubble: { padding: "9px 13px", borderRadius: 12, maxWidth: "80%", fontSize: 14, color: "white", wordBreak: "break-word" },
  chatInputRow: { display: "flex", gap: 6, padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" },
  chatInput: { flex: 1, padding: "9px 12px", borderRadius: 10, border: "none", background: "#1e293b", color: "white", outline: "none", fontSize: 14 },
  chatSend: { padding: "9px 16px", background: "#7c3aed", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 },
};