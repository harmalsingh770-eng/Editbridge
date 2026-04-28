"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where
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

      // Editors
      unsubEditors = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      // Access
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

  const handleAction = (editorId) => {
    if (!user) return;

    const status = accessMap[editorId];

    if (!status) return router.push(`/pay/${editorId}`);

    if (status === "pending") {
      return alert("⏳ Waiting for admin approval...");
    }

    // ✅ OPEN SAME CHAT
    const chatId = [user.uid, editorId].sort().join("_");

    router.push(`/chat/${chatId}`);
  };

  if (loading || !user) {
    return <div style={{color:"white",textAlign:"center",marginTop:50}}>Loading...</div>;
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1>🔥 Find Your Editor</h1>
        <button onClick={() => signOut(auth)}>Logout</button>
      </div>

      {editors.map(e => {
        const status = accessMap[e.id];

        let text = "🔒 Pay ₹10";
        let style = s.lock;

        if (status === "pending") {
          text = "⏳ Pending";
          style = s.pending;
        }

        if (status === "approved") {
          text = "💬 Chat";
          style = s.chat;
        }

        return (
          <div key={e.id} style={s.card}>
            <div>
              <b>{e.name}</b>
              <div>{e.skills?.join(", ")}</div>
            </div>

            <button
              onClick={() => handleAction(e.id)}
              style={style}
              disabled={status === "pending"}
            >
              {text}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  page: { padding: 20, background: "#020617", minHeight: "100vh", color: "white" },
  header: { display: "flex", justifyContent: "space-between" },
  card: { display: "flex", justifyContent: "space-between", padding: 15, background: "#1e293b", marginTop: 10, borderRadius: 10 },
  lock: { background: "#7c3aed", color: "white", border: "none", padding: 8, borderRadius: 8 },
  pending: { background: "#f59e0b", color: "white", border: "none", padding: 8, borderRadius: 8 },
  chat: { background: "#22c55e", color: "white", border: "none", padding: 8, borderRadius: 8 }
};