"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, onSnapshot, updateDoc, doc, deleteDoc,
  getDoc, setDoc, addDoc, query, orderBy, serverTimestamp
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();
  const [tab, setTab] = useState("payments");

  const [payments, setPayments] = useState([]);
  const [editorPayments, setEditorPayments] = useState([]); // ✅ NEW
  const [editors, setEditors] = useState([]);
  const [users, setUsers] = useState([]);
  const [allChats, setAllChats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLogout, setShowLogout] = useState(false);

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const adminUidRef = useRef(null);
  const unsubChatRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      adminUidRef.current = u.uid;

      // client payments
      onSnapshot(collection(db, "paymentRequests"), snap => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      // ✅ editor payments
      onSnapshot(collection(db, "editorPayments"), snap => {
        setEditorPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      onSnapshot(collection(db, "editors"), snap => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      onSnapshot(collection(db, "users"), snap => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      onSnapshot(collection(db, "chats"), snap => {
        setAllChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });

    return () => unsubAuth();
  }, []);

  // ================= CHAT =================

  const openChat = async (targetUid, name) => {
    const myUid = adminUidRef.current;
    const chatId = [myUid, targetUid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
        users: [myUid, targetUid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastUpdated: serverTimestamp()
      });
    }

    setChatTarget({ chatId, name });
    setChatOpen(true);

    if (unsubChatRef.current) unsubChatRef.current();

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    unsubChatRef.current = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
    });
  };

  const sendMsg = async () => {
    if (!msgText.trim()) return;

    await addDoc(collection(db, "chats", chatTarget.chatId, "messages"), {
      text: msgText,
      sender: adminUidRef.current,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "chats", chatTarget.chatId), {
      lastMessage: msgText,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    setMsgText("");
  };

  const closeChat = () => {
    setChatOpen(false);
    setMessages([]);
  };

  // ================= PAYMENTS =================

  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "approved" });
  };

  const rejectPayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "rejected" });
  };

  // ✅ EDITOR PAYMENT APPROVE
  const approveEditorPayment = async (p) => {
    await updateDoc(doc(db, "editorPayments", p.id), {
      status: "approved"
    });
  };

  const rejectEditorPayment = async (p) => {
    await updateDoc(doc(db, "editorPayments", p.id), {
      status: "rejected"
    });
  };

  // ================= DELETE CHAT =================

  const deleteChat = async (chatId) => {
    if (!confirm("Delete this chat?")) return;

    await deleteDoc(doc(db, "chats", chatId));
    alert("Chat deleted");
  };

  // ================= UI =================

  if (loading) return <div style={s.loaderPage}><div style={s.spinner}></div></div>;

  return (
    <>
      <style>{css}</style>

      <div style={s.page}>

        {/* HEADER */}
        <div style={s.header}>
          <span style={s.logo}>Admin Panel</span>
          <div>
            <button onClick={() => setShowLogout(true)} style={s.btnRed}>Logout</button>
          </div>
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          {["payments", "editorPayments", "editors", "users", "messages"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={tab === t ? s.tabActive : s.tab}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={s.content}>

          {/* CLIENT PAYMENTS */}
          {tab === "payments" && payments.map(p => (
            <div key={p.id} style={s.card}>
              <div>
                <div>{p.email}</div>
                <div>Txn: {p.txnId}</div>
              </div>

              {p.status === "pending" && (
                <>
                  <button onClick={() => approvePayment(p)}>Approve</button>
                  <button onClick={() => rejectPayment(p)}>Reject</button>
                </>
              )}
            </div>
          ))}

          {/* ✅ EDITOR PAYMENTS */}
          {tab === "editorPayments" && editorPayments.map(p => (
            <div key={p.id} style={s.card}>
              <div>
                <div>Editor: {p.editorId}</div>
                <div>Amount: ₹{p.amount}</div>
                <div>Txn: {p.txnId}</div>
              </div>

              <div>
                {p.status === "pending" && (
                  <>
                    <button onClick={() => approveEditorPayment(p)}>Approve</button>
                    <button onClick={() => rejectEditorPayment(p)}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* CHATS */}
          {tab === "messages" && allChats.map(c => (
            <div key={c.id} style={s.card}>
              <div>{c.id}</div>

              <button onClick={() => router.push("/chat/" + c.id)}>
                Open
              </button>

              {/* ✅ DELETE BUTTON */}
              <button onClick={() => deleteChat(c.id)}>
                Delete
              </button>
            </div>
          ))}

        </div>
      </div>

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={s.chatPanel}>
          <div style={s.chatMessages}>
            {messages.map(m => (
              <div key={m.id}>{m.text}</div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={s.chatInputRow}>
            <input value={msgText} onChange={e => setMsgText(e.target.value)} />
            <button onClick={sendMsg}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}

const css = `body{margin:0}`;

const s = {
  page: { minHeight: "100vh", background: "#020617", color: "white" },
  header: { padding: 20, display: "flex", justifyContent: "space-between" },
  logo: { fontWeight: "bold" },
  tabs: { display: "flex", gap: 10, padding: 10 },
  tab: { padding: 10, background: "#1e293b", border: "none", color: "white" },
  tabActive: { padding: 10, background: "#7c3aed", border: "none", color: "white" },
  content: { padding: 20 },
  card: { padding: 15, background: "#1e293b", marginBottom: 10 },
  btnRed: { background: "red", color: "white", padding: 8 },
  loaderPage: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" },
  spinner: { width: 40, height: 40, border: "3px solid white", borderTop: "3px solid purple", borderRadius: "50%" },
  chatPanel: { position: "fixed", bottom: 0, right: 0, width: 300, height: 400, background: "#111" },
  chatMessages: { flex: 1, overflow: "auto" },
  chatInputRow: { display: "flex" }
};