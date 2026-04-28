import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("payments");

  // ✅ FIX 2: store adminUid in a ref so openChat always has the latest value
  const adminUidRef = useRef(null);
  const [adminUid, setAdminUid] = useState(null);

  // Chat panel state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");
  const bottomRef = useRef(null);

  // ✅ FIX 1 & 5: Store all unsub refs properly
  const unsubChatRef = useRef(null);
  const unsubPayRef = useRef(null);
  const unsubEditRef = useRef(null);
  const unsubAllChatsRef = useRef(null);

  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [hideApproved, setHideApproved] = useState(false);
  const [search, setSearch] = useState("");

  // 🔐 AUTH
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return router.replace("/login");
      if (user.email !== ADMIN_EMAIL) return router.replace("/");

      // ✅ FIX 2: set both state and ref
      setAdminUid(user.uid);
      adminUidRef.current = user.uid;

      // ✅ FIX 1 & 5: store unsub in refs, NOT returned from async callback
      unsubPayRef.current = onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      unsubEditRef.current = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      // ✅ NEW: listen to all chats for Chats tab
      unsubAllChatsRef.current = onSnapshot(collection(db, "chats"), (snap) => {
        setAllChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    });

    // ✅ FIX 1: cleanup ALL listeners on unmount
    return () => {
      unsubAuth();
      if (unsubPayRef.current) unsubPayRef.current();
      if (unsubEditRef.current) unsubEditRef.current();
      if (unsubAllChatsRef.current) unsubAllChatsRef.current();
      if (unsubChatRef.current) unsubChatRef.current();
    };
  }, []);

  // 💬 OPEN ADMIN CHAT WITH USER
  const openChat = async (targetUid, targetName) => {
    // ✅ FIX 2: use ref instead of state so it's never null
    const myUid = adminUidRef.current;
    if (!myUid) return alert("Auth not ready, try again");

    const ids = [myUid, targetUid].sort();
    const chatId = ids.join("_");

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: ids,
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastUpdated: serverTimestamp(),
      });
    }

    setChatTarget({ uid: targetUid, name: targetName, chatId });
    setChatOpen(true);

    if (unsubChatRef.current) unsubChatRef.current();
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    unsubChatRef.current = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatTarget(null);
    setMessages([]);
    if (unsubChatRef.current) unsubChatRef.current();
  };

  const sendAdminMsg = async () => {
    if (!msgText.trim() || !chatTarget) return;
    const msg = msgText;
    setMsgText("");
    await addDoc(collection(db, "chats", chatTarget.chatId, "messages"), {
      text: msg,
      sender: adminUidRef.current,
      createdAt: serverTimestamp(),
    });
    await setDoc(
      doc(db, "chats", chatTarget.chatId),
      { lastMessage: msg, lastUpdated: serverTimestamp() },
      { merge: true }
    );
  };

  // 💳 PAYMENT ACTIONS
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "approved" });
    await setDoc(doc(db, "clientAccess", p.uid), {
      uid: p.uid,
      email: p.email,
      txnId: p.txnId,
      status: "approved",
    });
  };

  const rejectPayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "rejected" });
    await setDoc(doc(db, "clientAccess", p.uid), {
      uid: p.uid,
      email: p.email,
      txnId: p.txnId,
      status: "rejected",
    });
  };

  // 🎬 EDITOR ACTIONS
  const approveEditor = async (id) =>
    await updateDoc(doc(db, "editors", id), { approved: true });

  const toggleActive = async (id, current) =>
    await updateDoc(doc(db, "editors", id), { active: !current });

  const deleteEditor = async (id) => {
    if (!confirm("Delete editor?")) return;
    await deleteDoc(doc(db, "editors", id));
  };

  // ✅ FIX 3: Logout confirmation
  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    setShowLogoutModal(false);
    auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div style={s.loaderPage}>
        <style>{css}</style>
        <div style={s.loader}></div>
      </div>
    );
  }

  const filteredPayments = payments
    .filter((p) => !hideApproved || p.status !== "approved")
    .filter((p) => p.email?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.status === "pending" ? -1 : 1));

  const filteredEditors = editors.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{css}</style>

      {/* ✅ FIX 3: LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 8px 0" }}>Logout?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px 0" }}>
              Do you really want to logout?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutModal(false)} style={s.modalCancel}>
                Stay
              </button>
              <button onClick={confirmLogout} style={s.modalConfirm}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={s.page}>

        {/* HEADER */}
        <div style={s.header}>
          <div style={s.logo}>Admin Panel</div>
          <div style={s.headerRight}>
            <button onClick={() => router.push("/")} style={s.homeBtn}>Home</button>
            <button onClick={() => setHideApproved(!hideApproved)} style={s.toggleBtn}>
              {hideApproved ? "Show All" : "Hide Approved"}
            </button>
            <button onClick={handleLogout} style={s.logout}>
              Logout
            </button>
          </div>
        </div>

        {/* STATS */}
        <div style={s.stats}>
          <Stat label="Editors" value={editors.length} />
          <Stat label="Pending" value={payments.filter((p) => p.status === "pending").length} />
          <Stat label="Approved" value={payments.filter((p) => p.status === "approved").length} />
          <Stat label="Chats" value={allChats.length} />
        </div>

        {/* SEARCH */}
        <div style={s.searchWrap}>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.search}
          />
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          <button style={tab === "payments" ? s.tabActive : s.tab} onClick={() => setTab("payments")}>
            Payments
          </button>
          <button style={tab === "editors" ? s.tabActive : s.tab} onClick={() => setTab("editors")}>
            Editors
          </button>
          <button style={tab === "chats" ? s.tabActive : s.tab} onClick={() => setTab("chats")}>
            Chats
          </button>
        </div>

        {/* CONTENT */}
        <div style={s.content}>

          {/* PAYMENTS TAB */}
          {tab === "payments" && filteredPayments.map((p) => (
            <div key={p.id} style={s.card}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14 }}>{p.email || "Unknown"}</b>
                <div style={s.sub}>Txn: {p.txnId}</div>
              </div>
              <div style={s.actions}>
                {p.status === "pending" && (
                  <>
                    <button onClick={() => approvePayment(p)} style={s.green}>Approve</button>
                    <button onClick={() => rejectPayment(p)} style={s.red}>Reject</button>
                  </>
                )}
                <button onClick={() => openChat(p.uid, p.email || "Client")} style={s.purple}>
                  Chat
                </button>
                <span style={s.badge(p.status)}>{p.status}</span>
              </div>
            </div>
          ))}

          {/* EDITORS TAB */}
          {tab === "editors" && filteredEditors.map((e) => (
            <div key={e.id} style={s.card}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14 }}>{e.name}</b>
                <div style={s.sub}>{e.skills?.join(", ")}</div>
              </div>
              <div style={s.actions}>
                {!e.approved && (
                  <button onClick={() => approveEditor(e.id)} style={s.green}>Approve</button>
                )}
                <button onClick={() => toggleActive(e.id, e.active)} style={s.blue}>
                  {e.active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => openChat(e.id, e.name || "Editor")} style={s.purple}>
                  Chat
                </button>
                <button onClick={() => deleteEditor(e.id)} style={s.red}>Delete</button>
              </div>
            </div>
          ))}

          {/* ✅ NEW: CHATS TAB */}
          {tab === "chats" && (
            allChats.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 30 }}>No chats yet.</p>
            ) : (
              allChats.map((c) => (
                <div key={c.id} style={s.card}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13 }}>{c.id}</b>
                    <div style={s.sub}>{c.lastMessage || "No messages"}</div>
                  </div>
                  <button
                    onClick={() => router.push("/chat/" + c.id)}
                    style={s.purple}
                  >
                    Open
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* ✅ FIX 4: CHAT PANEL - responsive width */}
      {chatOpen && (
        <div style={s.chatPanel}>
          <div style={s.chatHeader}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{chatTarget?.name}</span>
            <button onClick={closeChat} style={s.closeBtn}>X</button>
          </div>

          <div style={s.chatMessages}>
            {messages.length === 0 && (
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center", marginTop: 20 }}>
                No messages yet. Say hello!
              </p>
            )}
            {messages.map((m) => {
              const isMe = m.sender === adminUidRef.current;
              return (
                <div
                  key={m.id}
                  style={{
                    ...s.chatMsg,
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

          <div style={s.chatInput}>
            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendAdminMsg(); }}
              placeholder="Type message..."
              style={s.chatInputField}
            />
            <button onClick={sendAdminMsg} style={s.chatSend}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div style={s.statCard}>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

const css = `
  body { margin: 0; font-family: sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 480px) {
    .chat-panel { width: 100% !important; left: 0 !important; right: 0 !important; border-radius: 16px 16px 0 0 !important; }
  }
`;

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
    paddingBottom: 80,
  },
  loaderPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
  },
  loader: {
    width: 40,
    height: 40,
    border: "3px solid #333",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  // LOGOUT MODAL
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 300,
  },
  modal: {
    background: "#1e293b",
    borderRadius: 16,
    padding: 24,
    width: 280,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  modalCancel: {
    flex: 1,
    padding: "10px 16px",
    background: "#334155",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  modalConfirm: {
    flex: 1,
    padding: "10px 16px",
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    flexWrap: "wrap",
    gap: 8,
  },
  headerRight: { display: "flex", gap: 8, flexWrap: "wrap" },
  logo: { fontWeight: 800, fontSize: 16 },
  homeBtn: { background: "#334155", color: "white", padding: "7px 12px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  toggleBtn: { background: "#7c3aed", color: "white", padding: "7px 12px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  logout: { background: "#ef4444", color: "white", padding: "7px 12px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },

  stats: { display: "flex", gap: 8, padding: 16, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: 70, background: "#1e293b", padding: 12, borderRadius: 10 },
  statValue: { fontSize: 20, fontWeight: 700 },
  statLabel: { fontSize: 11, color: "#94a3b8" },

  searchWrap: { padding: "0 16px 10px" },
  search: { width: "100%", padding: 10, borderRadius: 8, border: "none", background: "#1e293b", color: "white", boxSizing: "border-box", outline: "none" },

  tabs: { display: "flex", gap: 8, padding: "0 16px 16px" },
  tab: { flex: 1, padding: 10, background: "#1e293b", border: "none", color: "white", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  tabActive: { flex: 1, padding: 10, background: "#7c3aed", border: "none", color: "white", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 },

  content: { padding: "0 16px" },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    background: "#1e293b",
    marginBottom: 10,
    borderRadius: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  sub: { fontSize: 12, color: "#94a3b8", marginTop: 3 },
  actions: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  green: { background: "#10b981", color: "white", padding: "6px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  red: { background: "#ef4444", color: "white", padding: "6px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  blue: { background: "#3b82f6", color: "white", padding: "6px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  purple: { background: "#7c3aed", color: "white", padding: "6px 10px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  badge: (status) => ({
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    background: status === "approved" ? "#10b981" : status === "rejected" ? "#ef4444" : "#f59e0b",
  }),

  // ✅ FIX 4: Chat panel responsive
  chatPanel: {
    position: "fixed",
    bottom: 0,
    right: 0,
    width: "min(320px, 100vw)",
    height: 420,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px 16px 0 0",
    display: "flex",
    flexDirection: "column",
    zIndex: 200,
    boxShadow: "0 -4px 30px rgba(0,0,0,0.5)",
  },
  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "white",
  },
  closeBtn: {
    background: "#334155",
    border: "none",
    color: "white",
    fontSize: 13,
    cursor: "pointer",
    padding: "4px 10px",
    borderRadius: 6,
  },
  chatMessages: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  chatMsg: {
    padding: "8px 12px",
    borderRadius: 10,
    maxWidth: "80%",
    fontSize: 13,
    color: "white",
    wordBreak: "break-word",
  },
  chatInput: {
    display: "flex",
    gap: 6,
    padding: "10px 12px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  chatInputField: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#1e293b",
    color: "white",
    outline: "none",
    fontSize: 13,
  },
  chatSend: {
    padding: "8px 14px",
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
};