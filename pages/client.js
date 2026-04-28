"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Client() {
  const [user, setUser] = useState(null);
  const [editors, setEditors] = useState([]);
  const [accessMap, setAccessMap] = useState({});
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let unsubEditors, unsubAccess;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      setUser(u);

      // 🔥 ONLY ACTIVE EDITORS
      const qEditors = query(
        collection(db, "editors"),
        where("active", "==", true)
      );

      unsubEditors = onSnapshot(qEditors, (snap) => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      const q = query(
        collection(db, "clientAccess"),
        where("uid", "==", u.uid)
      );

      unsubAccess = onSnapshot(q, (snap) => {
        const map = {};
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.editorId) {
            map[data.editorId] = data.status;
          }
        });
        setAccessMap(map);
      });
    });

    return () => {
      unsubAuth();
      unsubEditors && unsubEditors();
      unsubAccess && unsubAccess();
    };
  }, []);

  const handleAction = async (editorId) => {
    const status = accessMap[editorId];

    if (!status) return router.push(`/pay/${editorId}`);
    if (status === "pending") return alert("⏳ Pending");
    if (status === "rejected") return alert("❌ Rejected");

    const chatId = [user.uid, editorId].sort().join("_");

    await setDoc(doc(db, "chats", chatId), {
      users: [user.uid, editorId],
      createdAt: serverTimestamp()
    }, { merge: true });

    router.push(`/chat/${chatId}`);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1>🔥 Find Editor</h1>
        <button onClick={() => signOut(auth)} style={s.logout}>Logout</button>
      </div>

      {editors.map((e) => {
        const status = accessMap[e.id];

        let text = "🔒 Pay ₹10";
        let style = s.lock;

        if (status === "pending") { text = "⏳ Pending"; style = s.pending; }
        if (status === "approved") { text = "💬 Chat"; style = s.chat; }
        if (status === "rejected") { text = "❌ Rejected"; style = s.rejected; }

        return (
          <div key={e.id} style={s.card}>
            <div style={{ flex: 1 }}>
              <h3>{e.name}</h3>

              <p style={s.bio}>{e.bio}</p>

              <div style={s.skills}>
                {e.skills?.join(", ")}
              </div>

              <div style={s.price}>₹{e.price}</div>

              {e.portfolio?.length > 0 && (
                <button
                  style={s.portfolioBtn}
                  onClick={() => window.open(e.portfolio[0], "_blank")}
                >
                  🎬 View Portfolio
                </button>
              )}
            </div>

            <button onClick={() => handleAction(e.id)} style={style}>
              {text}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  page:{ padding:20, background:"#020617", minHeight:"100vh", color:"white" },
  header:{ display:"flex", justifyContent:"space-between", marginBottom:20 },
  logout:{ background:"#ef4444", padding:8, borderRadius:8, color:"white" },

  card:{ display:"flex", justifyContent:"space-between", padding:16, marginTop:12, background:"#1e293b", borderRadius:12 },

  bio:{ fontSize:13, color:"#cbd5f5", whiteSpace:"pre-wrap" },
  skills:{ fontSize:12, color:"#94a3b8" },
  price:{ color:"#22c55e", marginTop:5 },

  portfolioBtn:{ marginTop:8, background:"#0ea5e9", padding:6, borderRadius:8, color:"white" },

  lock:{ background:"#7c3aed", padding:8, borderRadius:8, color:"white" },
  pending:{ background:"#f59e0b", padding:8, borderRadius:8 },
  chat:{ background:"#22c55e", padding:8, borderRadius:8 },
  rejected:{ background:"#ef4444", padding:8, borderRadius:8 }
};