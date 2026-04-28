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

  // 🔐 AUTH + DATA LOAD
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      adminUidRef.current = u.uid;

      const unsub1 = onSnapshot(collection(db, "paymentRequests"), snap =>
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

      const unsub2 = onSnapshot(collection(db, "editors"), snap =>
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

      const unsub3 = onSnapshot(collection(db, "users"), snap =>
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

      const unsub4 = onSnapshot(collection(db, "chats"), snap =>
        setAllChats(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

      const unsub5 = onSnapshot(collection(db, "editorPayments"), snap =>
        setEditorPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

      setLoading(false);

      return () => {
        unsub1(); unsub2(); unsub3(); unsub4(); unsub5();
      };
    });

    return () => unsubAuth();
  }, []);

  // 💬 OPEN CHAT
  const openChat = async (uid, name) => {
    const chatId = [adminUidRef.current, uid].sort().join("_");

    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        users: [adminUidRef.current, uid],
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

    unsubChatRef.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  };

  // 💬 SEND MESSAGE
  const sendMsg = async () => {
    if (!msgText.trim()) return;

    await addDoc(collection(db, "chats", chatTarget.chatId, "messages"), {
      text: msgText,
      sender: adminUidRef.current,
      createdAt: serverTimestamp()
    });

    setMsgText("");
  };

  // ✅ APPROVE PAYMENT
  const approvePayment = async (p) => {
    try {
      await updateDoc(doc(db, "paymentRequests", p.id), { status: "approved" });

      await setDoc(doc(db, "clientAccess", p.chatId), {
        uid: p.uid,
        editorId: p.editorId,
        chatId: p.chatId,
        status: "approved"
      });

      await addDoc(collection(db, "editorPayments"), {
        editorId: p.editorId,
        amount: 10,
        status: "pending",
        createdAt: serverTimestamp()
      });

      alert("Approved ✅");
    } catch (err) {
      alert(err.message);
    }
  };

  // 💰 MARK EDITOR PAID
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

      {/* HEADER */}
      <div style={s.header}>
        <h2>⚡ Admin Panel</h2>
        <button onClick={logout} style={s.logout}>Logout</button>
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

      {/* PAYMENTS */}
      {tab === "payments" && payments.map(p => (
        <div key={p.id} style={s.card}>
          <div>
            <b>{p.email}</b><br/>
            Txn: {p.txnId}
          </div>
          <button style={s.green} onClick={() => approvePayment(p)}>Approve</button>
          <button style={s.purple} onClick={() => openChat(p.uid, p.email)}>Chat</button>
        </div>
      ))}

      {/* EDITOR PAYMENTS */}
      {tab === "editorPayments" && editorPayments.map(p => (
        <div key={p.id} style={s.card}>
          Editor: {p.editorId} | ₹{p.amount}
          {p.status === "pending" && (
            <button style={s.green} onClick={() => markEditorPaid(p.id)}>Mark Paid</button>
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
          <button style={s.purple} onClick={() => router.push("/chat/" + c.id)}>Open</button>
        </div>
      ))}

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={s.chatBox}>
          <div style={s.chatHeader}>
            {chatTarget?.name}
            <button onClick={() => setChatOpen(false)}>X</button>
          </div>

          <div style={s.chatMsgs}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  ...s.msg,
                  alignSelf: m.sender === adminUidRef.current ? "flex-end" : "flex-start",
                  background: m.sender === adminUidRef.current ? "#7c3aed" : "#334155"
                }}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          <div style={s.chatInput}>
            <input
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Type..."
            />
            <button onClick={sendMsg}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{background:"#020617",minHeight:"100vh",padding:20,color:"white"},
  header:{display:"flex",justifyContent:"space-between"},
  tabs:{display:"flex",gap:10,margin:"20px 0"},
  tab:{padding:8,background:"#1e293b",borderRadius:8,color:"#94a3b8"},
  tabActive:{padding:8,background:"#7c3aed",borderRadius:8},

  card:{background:"#1e293b",padding:12,borderRadius:10,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"},

  green:{background:"#10b981",padding:6,border:"none",borderRadius:6,color:"white"},
  purple:{background:"#7c3aed",padding:6,border:"none",borderRadius:6,color:"white"},
  logout:{background:"#ef4444",padding:8,border:"none",borderRadius:8},

  loader:{color:"white",textAlign:"center",marginTop:100},

  chatBox:{position:"fixed",bottom:0,right:0,width:320,height:420,background:"#0f172a",display:"flex",flexDirection:"column"},
  chatHeader:{display:"flex",justifyContent:"space-between",padding:10},
  chatMsgs:{flex:1,overflow:"auto",display:"flex",flexDirection:"column",gap:8,padding:10},
  msg:{padding:10,borderRadius:10,maxWidth:"75%"},
  chatInput:{display:"flex"},
};