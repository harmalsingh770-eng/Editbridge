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

  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("payments");

  // CHAT STATE
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const bottomRef = useRef(null);
  const adminUidRef = useRef(null);
  const unsubChatRef = useRef(null);

  // AUTH
  useEffect(() => {
    let unsubPay, unsubEdit;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      setUser(u);
      adminUidRef.current = u.uid;

      // PAYMENTS
      unsubPay = onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // EDITORS
      unsubEdit = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      unsubPay && unsubPay();
      unsubEdit && unsubEdit();
      unsubChatRef.current && unsubChatRef.current();
    };
  }, []);

  // 🔥 OPEN CHAT
  const openChat = async (targetUid, name) => {
    const myUid = adminUidRef.current;
    if (!myUid) return alert("Auth not ready");

    const chatId = [myUid, targetUid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    // CREATE CHAT IF NOT EXISTS
    if (!snap.exists()) {
      await setDoc(chatRef, {
        users: [myUid, targetUid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastUpdated: serverTimestamp(),
        typing: {},
        seen: {},
      });
    }

    setChatTarget({ uid: targetUid, name, chatId });
    setChatOpen(true);

    // LISTEN MESSAGES
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
      {
        lastMessage: msg,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // 💳 APPROVE PAYMENT (CRITICAL FIX)
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved",
    });

    // 🔥 IMPORTANT: include editorId
    await setDoc(doc(db, "clientAccess", p.uid + "_" + p.editorId), {
      uid: p.uid,
      editorId: p.editorId,
      status: "approved",
    });
  };

  const rejectPayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "rejected",
    });

    await setDoc(doc(db, "clientAccess", p.uid + "_" + p.editorId), {
      uid: p.uid,
      editorId: p.editorId,
      status: "rejected",
    });
  };

  if (loading || !user) {
    return <div style={{color:"white",textAlign:"center",marginTop:50}}>Loading...</div>;
  }

  return (
    <div style={s.page}>
      <h1>Admin Panel</h1>

      <div style={s.tabs}>
        <button onClick={()=>setTab("payments")}>Payments</button>
        <button onClick={()=>setTab("editors")}>Editors</button>
      </div>

      {/* PAYMENTS */}
      {tab === "payments" && payments.map(p => (
        <div key={p.id} style={s.card}>
          <div>
            <b>{p.email}</b>
            <div>Txn: {p.txnId}</div>
          </div>

          <div style={s.actions}>
            {p.status === "pending" && (
              <>
                <button onClick={()=>approvePayment(p)} style={s.green}>Approve</button>
                <button onClick={()=>rejectPayment(p)} style={s.red}>Reject</button>
              </>
            )}

            <button onClick={()=>openChat(p.uid, p.email)} style={s.purple}>
              Chat
            </button>
          </div>
        </div>
      ))}

      {/* EDITORS */}
      {tab === "editors" && editors.map(e => (
        <div key={e.id} style={s.card}>
          <div>
            <b>{e.name}</b>
          </div>

          <div style={s.actions}>
            <button onClick={()=>openChat(e.id, e.name)} style={s.purple}>
              Chat
            </button>

            <button onClick={()=>deleteDoc(doc(db,"editors",e.id))} style={s.red}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={s.chatPanel}>
          <div style={s.chatHeader}>
            {chatTarget?.name}
            <button onClick={()=>setChatOpen(false)}>X</button>
          </div>

          <div style={s.chatBody}>
            {messages.map(m => {
              const isMe = m.sender === adminUidRef.current;

              return (
                <div key={m.id} style={{
                  ...s.msg,
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  background: isMe ? "#7c3aed" : "#334155"
                }}>
                  {m.text}
                </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>

          <div style={s.chatInput}>
            <input
              value={msgText}
              onChange={(e)=>setMsgText(e.target.value)}
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
  page:{padding:20,background:"#020617",minHeight:"100vh",color:"white"},
  tabs:{display:"flex",gap:10,marginBottom:10},
  card:{display:"flex",justifyContent:"space-between",padding:15,background:"#1e293b",marginTop:10,borderRadius:10},
  actions:{display:"flex",gap:6},
  green:{background:"#22c55e",color:"white",border:"none",padding:6},
  red:{background:"#ef4444",color:"white",border:"none",padding:6},
  purple:{background:"#7c3aed",color:"white",border:"none",padding:6},

  chatPanel:{
    position:"fixed",bottom:0,right:0,width:300,height:400,
    background:"#0f172a",display:"flex",flexDirection:"column"
  },
  chatHeader:{padding:10,display:"flex",justifyContent:"space-between"},
  chatBody:{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8},
  msg:{padding:8,borderRadius:10,maxWidth:"70%"},
  chatInput:{display:"flex",gap:5,padding:10}
};