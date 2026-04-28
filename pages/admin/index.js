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
  const [editors, setEditors] = useState([]);
  const [users, setUsers] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLogout, setShowLogout] = useState(false);

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

      onSnapshot(collection(db, "paymentRequests"), snap => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
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

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));

    if (unsubChatRef.current) unsubChatRef.current();

    unsubChatRef.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  };

  const sendMsg = async () => {
    if (!msgText.trim()) return;

    const msg = msgText;
    setMsgText("");

    await addDoc(collection(db, "chats", chatTarget.chatId, "messages"), {
      text: msg,
      sender: adminUidRef.current,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "chats", chatTarget.chatId), {
      lastMessage: msg,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  };

  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "approved" });
  };

  const rejectPayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "rejected" });
  };

  if (loading) return <div style={s.loader}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2>⚡ Admin Panel</h2>
        <button onClick={() => signOut(auth)} style={s.logout}>Logout</button>
      </div>

      <div style={s.tabs}>
        {["payments","editors","users","messages"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={tab===t?s.tabActive:s.tab}>
            {t}
          </button>
        ))}
      </div>

      <div style={s.container}>
        {tab === "payments" && payments.map(p => (
          <div key={p.id} style={s.card}>
            <div>
              <h4>{p.email}</h4>
              <p>Txn: {p.txnId}</p>
              <p>Editor: {p.editorId}</p>
            </div>

            <div style={s.actions}>
              <button onClick={()=>approvePayment(p)} style={s.green}>Approve</button>
              <button onClick={()=>rejectPayment(p)} style={s.red}>Reject</button>
              <button onClick={()=>openChat(p.uid,p.email)} style={s.purple}>Chat</button>
            </div>
          </div>
        ))}
      </div>

      {chatOpen && (
        <div style={s.chat}>
          <div style={s.chatBox}>
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

          <div style={s.inputRow}>
            <input value={msgText} onChange={e=>setMsgText(e.target.value)} style={s.input}/>
            <button onClick={sendMsg} style={s.purple}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{minHeight:"100vh",background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",color:"white",padding:20},
  header:{display:"flex",justifyContent:"space-between"},
  logout:{background:"#ef4444",border:"none",padding:8,color:"white",borderRadius:8},

  tabs:{display:"flex",gap:10,marginTop:20},
  tab:{background:"#1e293b",padding:8,borderRadius:8,color:"#aaa"},
  tabActive:{background:"#7c3aed",padding:8,borderRadius:8},

  container:{marginTop:20},
  card:{background:"rgba(30,41,59,0.6)",padding:16,borderRadius:16,display:"flex",justifyContent:"space-between",marginBottom:10},

  actions:{display:"flex",gap:6},
  green:{background:"#10b981",border:"none",padding:6,color:"white",borderRadius:8},
  red:{background:"#ef4444",border:"none",padding:6,color:"white",borderRadius:8},
  purple:{background:"#7c3aed",border:"none",padding:6,color:"white",borderRadius:8},

  chat:{position:"fixed",bottom:0,right:0,width:320,height:400,background:"#0f172a"},
  chatBox:{flex:1,display:"flex",flexDirection:"column",padding:10},
  msg:{background:"#334155",padding:8,borderRadius:10,maxWidth:"70%"},
  inputRow:{display:"flex"},
  input:{flex:1,padding:8,background:"#020617",color:"white"}
};