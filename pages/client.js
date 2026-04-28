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

      // 🔥 Load editors
      unsubEditors = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      // 🔥 Load payment status
      const q = query(
        collection(db, "clientAccess"),
        where("uid", "==", u.uid)
      );

      unsubAccess = onSnapshot(q, (snap) => {
        const map = {};
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.editorId) {
            map[data.editorId] = data.status; // pending / approved / rejected
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

  // 🔥 HANDLE BUTTON CLICK
  const handleAction = async (editorId) => {
    if (!user) return;

    const status = accessMap[editorId];

    // 💰 NOT PAID
    if (!status) {
      return router.push(`/pay/${editorId}`);
    }

    // ⏳ PENDING
    if (status === "pending") {
      return alert("⏳ Waiting for admin approval...");
    }

    // ❌ REJECTED
    if (status === "rejected") {
      return alert("❌ Payment rejected. Contact support.");
    }

    // ✅ APPROVED → OPEN CHAT
    const chatId = [user.uid, editorId].sort().join("_");

    await setDoc(
      doc(db, "chats", chatId),
      {
        users: [user.uid, editorId],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastUpdated: serverTimestamp()
      },
      { merge: true }
    );

    router.push(`/chat/${chatId}`);
  };

  if (loading || !user) {
    return (
      <div style={s.loader}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.title}>🔥 Find Your Editor</h1>
        <button onClick={() => signOut(auth)} style={s.logout}>
          Logout
        </button>
      </div>

      {/* EDITOR LIST */}
      {editors.map((e) => {
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

        if (status === "rejected") {
          text = "❌ Rejected";
          style = s.rejected;
        }

        return (
          <div key={e.id} style={s.card}>
            <div>
              <b style={{ fontSize: 16 }}>{e.name}</b>
              <div style={s.skills}>
                {e.skills?.join(", ") || "No skills added"}
              </div>
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
  page: {
    padding: 20,
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  title: {
    fontSize: 22,
    fontWeight: "700"
  },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    color: "white",
    cursor: "pointer"
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    background: "rgba(30,41,59,0.7)",
    marginTop: 12,
    borderRadius: 14,
    backdropFilter: "blur(10px)"
  },

  skills: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4
  },

  lock: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer"
  },

  pending: {
    background: "#f59e0b",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10
  },

  chat: {
    background: "#22c55e",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer"
  },

  rejected: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617"
  },

  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};
