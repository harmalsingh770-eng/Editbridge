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
  const [editors, setEditors] = useState([]);
  const [accessMap, setAccessMap] = useState({});
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let unsubEditors = null;
    let unsubAccess = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");

      // ✅ REALTIME EDITORS
      unsubEditors = onSnapshot(collection(db, "editors"), (snap) => {
        const list = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setEditors(list);
        setLoading(false);
      });

      // ✅ REALTIME ACCESS (AUTO UPDATE AFTER ADMIN APPROVES)
      const q = query(
        collection(db, "clientAccess"),
        where("uid", "==", u.uid)
      );

      unsubAccess = onSnapshot(q, (snap) => {
        const map = {};
        snap.docs.forEach(d => {
          const data = d.data();
          map[data.editorId] = data.status;
        });
        setAccessMap(map);
      });
    });

    return () => {
      unsubAuth();
      if (unsubEditors) unsubEditors();
      if (unsubAccess) unsubAccess();
    };
  }, []);

  const handleAction = async (editorId) => {
    const user = auth.currentUser;
    if (!user) return;

    const status = accessMap[editorId];

    if (!status) {
      return router.push(`/pay/${editorId}`);
    }

    if (status === "pending") {
      return alert("⏳ Waiting for admin approval...");
    }

    // ✅ OPEN CHAT
    const ids = [user.uid, editorId].sort();
    const chatId = ids.join("_");

    await setDoc(doc(db, "chats", chatId), {
      users: [user.uid, editorId],
      createdAt: serverTimestamp()
    }, { merge: true });

    router.push(`/chat/${chatId}`);
  };

  if (loading) {
    return (
      <div style={s.loaderPage}>
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

      {/* LIST */}
      <div style={s.grid}>
        {editors.map((e) => {
          const status = accessMap[e.id];

          let btnText = "🔒 Pay ₹10";
          let btnStyle = s.lockBtn;
          let badge = null;

          if (status === "pending") {
            btnText = "⏳ Pending";
            btnStyle = s.pendingBtn;
            badge = <span style={s.badgePending}>Pending</span>;
          }

          if (status === "approved") {
            btnText = "💬 Chat Now";
            btnStyle = s.chatBtn;
            badge = <span style={s.badgeApproved}>Unlocked</span>;
          }

          return (
            <div key={e.id} style={s.card}>
              <div style={s.top}>
                <div style={s.avatar}>
                  {e.name?.[0]?.toUpperCase() || "E"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={s.name}>{e.name}</div>
                  <div style={s.skills}>
                    {e.skills?.join(", ") || "No skills"}
                  </div>
                </div>

                {badge}
              </div>

              <div style={s.bottom}>
                <div style={s.price}>₹{e.price}</div>

                <button
                  onClick={() => handleAction(e.id)}
                  style={btnStyle}
                  disabled={status === "pending"}
                >
                  {btnText}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  title: {
    fontSize: 24,
    fontWeight: 800
  },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 16px",
    borderRadius: 10,
    color: "white",
    cursor: "pointer"
  },

  grid: {
    display: "grid",
    gap: 16
  },

  card: {
    padding: 18,
    borderRadius: 16,
    background: "rgba(30,41,59,0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },

  top: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#7c3aed,#6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700
  },

  name: { fontWeight: 700 },
  skills: { fontSize: 12, color: "#94a3b8" },

  bottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  price: {
    color: "#a78bfa",
    fontWeight: 600
  },

  chatBtn: {
    background: "#22c55e",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    color: "white",
    fontWeight: 600
  },

  lockBtn: {
    background: "#7c3aed",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    color: "white",
    fontWeight: 600
  },

  pendingBtn: {
    background: "#f59e0b",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    color: "white",
    fontWeight: 600
  },

  badgeApproved: {
    fontSize: 10,
    background: "#22c55e",
    padding: "4px 8px",
    borderRadius: 6
  },

  badgePending: {
    fontSize: 10,
    background: "#f59e0b",
    padding: "4px 8px",
    borderRadius: 6
  },

  loaderPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
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