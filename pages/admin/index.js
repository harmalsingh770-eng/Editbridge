"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();

  const [tab, setTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [users, setUsers] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [editorPayments, setEditorPayments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const adminUidRef = useRef(null);
  const unsubChatRef = useRef(null);
  const bottomRef = useRef(null);

  // 🔐 AUTH + DATA
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      adminUidRef.current = u.uid;

      // CLIENT PAYMENTS
      onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      // EDITORS
      onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // USERS
      onSnapshot(collection(db, "users"), (snap) => {
        setUsers(snap.docs.map(d => ({
          id: d.id,
          email: d.data().email || "No Email",
          role: d.data().role || "client"
        })));
      });

      // CHATS
      onSnapshot(collection(db, "chats"), (snap) => {
        setAllChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // 💰 EDITOR PAYMENTS
      onSnapshot(collection(db, "editorPayments"), (snap) => {
        setEditorPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });

    return () => unsub();
  }, []);

  // 💬 OPEN CHAT
  const openChat = async (targetUid, name) => {
    const chatId = [adminUidRef.current, targetUid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
        users: [adminUidRef.current, targetUid],
        createdAt: serverTimestamp()
      });
    }

    setChatTarget({ chatId, name });
    setChatOpen(true);

    if (unsubChatRef.current) unsubChatRef.current();

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

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

    setMsgText("");
  };

  // ✅ APPROVE CLIENT PAYMENT
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved"
    });

    await setDoc(doc(db, "clientAccess", p.chatId), {
      uid: p.uid,
      editorId: p.editorId,
      chatId: p.chatId,
      status: "approved"
    });

    // 💰 ADD ENTRY FOR EDITOR EARNING
    await addDoc(collection(db, "editorPayments"), {
      editorId: p.editorId,
      amount: 10, // your platform price
      status: "pending",
      createdAt: serverTimestamp()
    });
  };

  const markEditorPaid = async (id) => {
    await updateDoc(doc(db, "editorPayments", id), {
      status: "paid"
    });
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div style={s.loader}>Loading...</div>;

  return (
    <div style={s.page}>

      <div style={s.header}>
        <h2>Admin Panel</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={s.tabs}>
        {["payments", "editorPayments", "editors", "users", "messages"].map(t => (
          <button key={t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* CLIENT PAYMENTS */}
      {tab === "payments" && payments.map(p => (
        <div key={p.id} style={s.card}>
          {p.email} | {p.txnId}
          <button onClick={() => approvePayment(p)}>Approve</button>
          <button onClick={() => openChat(p.uid, p.email)}>Chat</button>
        </div>
      ))}

      {/* 💰 EDITOR PAYMENTS */}
      {tab === "editorPayments" && editorPayments.map(p => (
        <div key={p.id} style={s.card}>
          Editor: {p.editorId} | ₹{p.amount} | {p.status}
          {p.status === "pending" && (
            <button onClick={() => markEditorPaid(p.id)}>Mark Paid</button>
          )}
        </div>
      ))}

      {/* EDITORS */}
      {tab === "editors" && editors.map(e => (
        <div key={e.id} style={s.card}>
          {e.name} | ₹{e.price}
        </div>
      ))}

      {/* USERS */}
      {tab === "users" && users.map(u => (
        <div key={u.id} style={s.card}>
          {u.email}
        </div>
      ))}

      {/* CHATS */}
      {tab === "messages" && allChats.map(c => (
        <div key={c.id} style={s.card}>
          {c.id}
          <button onClick={() => router.push("/chat/" + c.id)}>Open</button>
        </div>
      ))}

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={s.chatBox}>
          <div style={s.chatMsgs}>
            {messages.map(m => (
              <p key={m.id}>{m.text}</p>
            ))}
            <div ref={bottomRef}/>
          </div>

          <div style={s.chatInput}>
            <input value={msgText} onChange={e => setMsgText(e.target.value)} />
            <button onClick={sendMsg}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{padding:20,color:"white",background:"#020617",minHeight:"100vh"},
  header:{display:"flex",justifyContent:"space-between"},
  tabs:{display:"flex",gap:10,margin:"20px 0"},
  card:{padding:10,background:"#1e293b",marginBottom:10,borderRadius:10},
  loader:{color:"white",textAlign:"center",marginTop:50},
  chatBox:{position:"fixed",bottom:0,right:0,width:300,background:"#111"},
  chatMsgs:{height:200,overflow:"auto"},
  chatInput:{display:"flex"}
};