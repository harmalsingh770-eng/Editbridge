"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();

  const [tab, setTab] = useState("dashboard");
  const [user, setUser] = useState(null);

  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);

  const [search, setSearch] = useState("");

  // CHAT
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const adminUidRef = useRef(null);
  const unsubChatRef = useRef(null);
  const bottomRef = useRef(null);

  // 🔐 AUTH + DATA
  useEffect(() => {
    let unsubPay, unsubEdit;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      setUser(u);
      adminUidRef.current = u.uid;

      unsubPay = onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      unsubEdit = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsubAuth();
      unsubPay && unsubPay();
      unsubEdit && unsubEdit();
      unsubChatRef.current && unsubChatRef.current();
    };
  }, []);

  // 💬 OPEN CHAT
  const openChat = async (targetUid, name) => {
    const chatId = [adminUidRef.current, targetUid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
        users: [adminUidRef.current, targetUid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastUpdated: serverTimestamp()
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
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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

  // 💳 APPROVE
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved"
    });

    await setDoc(doc(db, "clientAccess", p.uid + "_" + p.editorId), {
      uid: p.uid,
      editorId: p.editorId,
      status: "approved"
    });
  };

  // ❌ DELETE EDITOR
  const deleteEditor = async (id) => {
    if (!confirm("Delete editor?")) return;
    await deleteDoc(doc(db, "editors", id));
  };

  // 📊 STATS
  const totalRevenue = payments.filter(p => p.status === "approved").length * 10;

  if (!user) return null;

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <h1>⚡ Admin Control</h1>
        <button onClick={() => signOut(auth)} style={s.logout}>
          Logout
        </button>
      </div>

      {/* TABS */}
      <div style={s.tabs}>
        <button onClick={()=>setTab("dashboard")}>Dashboard</button>
        <button onClick={()=>setTab("payments")}>Payments</button>
        <button onClick={()=>setTab("editors")}>Editors</button>
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div style={s.grid}>
          <div style={s.stat}>👨‍💻 Editors<br/><b>{editors.length}</b></div>
          <div style={s.stat}>💳 Payments<br/><b>{payments.length}</b></div>
          <div style={s.stat}>💰 Revenue<br/><b>₹{totalRevenue}</b></div>
        </div>
      )}

      {/* PAYMENTS */}
      {tab === "payments" && payments.map(p => (
        <div key={p.id} style={s.card}>
          <div>
            <b>{p.email}</b>
            <div>{p.txnId}</div>
            <div>Status: {p.status}</div>
          </div>

          <div style={s.actions}>
            {p.status === "pending" && (
              <button onClick={()=>approvePayment(p)} style={s.green}>
                Approve
              </button>
            )}

            <button onClick={()=>openChat(p.uid, p.email)} style={s.purple}>
              Chat
            </button>
          </div>
        </div>
      ))}

      {/* EDITORS */}
      {tab === "editors" && (
        <>
          <input
            placeholder="Search editor..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            style={s.search}
          />

          {editors
            .filter(e => e.name?.toLowerCase().includes(search.toLowerCase()))
            .map(e => (
              <div key={e.id} style={s.card}>
                <div>
                  <b>{e.name}</b>
                  <div>{e.skills?.join(", ")}</div>
                </div>

                <div style={s.actions}>
                  <button onClick={()=>openChat(e.id, e.name)} style={s.purple}>
                    Chat
                  </button>

                  <button onClick={()=>deleteEditor(e.id)} style={s.red}>
                    Delete
                  </button>
                </div>
              </div>
          ))}
        </>
      )}

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={s.chat}>
          <div style={s.chatHeader}>
            {chatTarget?.name}
            <button onClick={()=>setChatOpen(false)}>X</button>
          </div>

          <div style={s.chatBody}>
            {messages.map(m => (
              <div key={m.id} style={{
                ...s.msg,
                alignSelf: m.sender === adminUidRef.current ? "flex-end" : "flex-start"
              }}>
                {m.text}
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          <div style={s.chatInput}>
            <input value={msgText} onChange={(e)=>setMsgText(e.target.value)} />
            <button onClick={sendMsg}>Send</button>
          </div>
        </div>
      )}

    </div>
  );
}

const s = {
  page:{
    minHeight:"100vh",
    padding:20,
    background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color:"white"
  },

  header:{
    display:"flex",
    justifyContent:"space-between",
    marginBottom:20
  },

  logout:{
    background:"#ef4444",
    border:"none",
    padding:"8px 14px",
    borderRadius:8,
    color:"white"
  },

  tabs:{
    display:"flex",
    gap:10,
    marginBottom:20
  },

  grid:{
    display:"flex",
    gap:15
  },

  stat:{
    background:"rgba(30,41,59,0.6)",
    padding:20,
    borderRadius:14,
    flex:1,
    textAlign:"center"
  },

  card:{
    display:"flex",
    justifyContent:"space-between",
    padding:15,
    background:"#1e293b",
    borderRadius:12,
    marginTop:10
  },

  actions:{
    display:"flex",
    gap:8
  },

  green:{background:"#22c55e",border:"none",padding:6,color:"white"},
  red:{background:"#ef4444",border:"none",padding:6,color:"white"},
  purple:{background:"#7c3aed",border:"none",padding:6,color:"white"},

  search:{
    width:"100%",
    padding:10,
    marginBottom:10,
    borderRadius:8
  },

  chat:{
    position:"fixed",
    bottom:0,
    right:0,
    width:320,
    height:420,
    background:"#0f172a",
    display:"flex",
    flexDirection:"column"
  },

  chatHeader:{padding:10,display:"flex",justifyContent:"space-between"},
  chatBody:{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6},
  msg:{background:"#334155",padding:8,borderRadius:8,maxWidth:"70%"},
  chatInput:{display:"flex",gap:5,padding:10}
};