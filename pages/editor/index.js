"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Editor() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const router = useRouter();

  // 🔐 Auth + Fetch chats
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);

      const q = query(
        collection(db, "chats"),
        where("editorId", "==", u.uid)
      );

      onSnapshot(q, (snap) => {
        setChats(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }))
        );
      });
    });

    return () => unsub();
  }, []);

  // 🚪 Logout
  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div style={s.page}>
      {/* TOP BAR */}
      <div style={s.topbar}>
        <h2 style={s.logo}>💜 Editor Dashboard</h2>

        <div style={s.actions}>
          <button
            onClick={() => router.push("/editor/profile")}
            style={s.btnPrimary}
          >
            ✏️ Edit Portfolio
          </button>

          <button onClick={logout} style={s.btnDanger}>
            Logout
          </button>
        </div>
      </div>

      {/* INBOX */}
      <div style={s.container}>
        <h3 style={s.heading}>Inbox</h3>

        {chats.length === 0 ? (
          <p style={s.empty}>No chats yet...</p>
        ) : (
          <div style={s.chatList}>
            {chats.map((chat) => (
              <div
                key={chat.id}
                style={s.chatCard}
                onClick={() => router.push(`/chat/${chat.id}`)}
              >
                <div>
                  <h4 style={s.chatTitle}>Client Chat</h4>
                  <p style={s.chatSub}>
                    Chat ID: {chat.id.slice(0, 10)}...
                  </p>
                </div>

                <div style={s.status}>
                  {chat.unlocked ? (
                    <span style={s.unlocked}>Unlocked</span>
                  ) : (
                    <span style={s.locked}>Locked</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
    color: "#fff",
    padding: 20
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30
  },

  logo: {
    fontSize: 22,
    fontWeight: "bold"
  },

  actions: {
    display: "flex",
    gap: 10
  },

  btnPrimary: {
    padding: "10px 14px",
    background: "#7c3aed",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600
  },

  btnDanger: {
    padding: "10px 14px",
    background: "#ef4444",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer"
  },

  container: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(12px)"
  },

  heading: {
    marginBottom: 15
  },

  empty: {
    color: "#aaa"
  },

  chatList: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  chatCard: {
    padding: 15,
    borderRadius: 12,
    background: "rgba(255,255,255,0.07)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "0.2s"
  },

  chatTitle: {
    margin: 0
  },

  chatSub: {
    margin: 0,
    fontSize: 12,
    color: "#aaa"
  },

  status: {},

  unlocked: {
    background: "#22c55e",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 12
  },

  locked: {
    background: "#f59e0b",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 12
  }
};