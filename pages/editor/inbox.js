"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function EditorInbox() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let unsubChats;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login?type=editor");
        return;
      }

      // 🔥 GET ONLY EDITOR CHATS
      const q = query(
        collection(db, "chats"),
        where("editorId", "==", user.uid)
      );

      unsubChats = onSnapshot(q, (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setChats(data);
        setLoading(false);
      });
    });

    return () => {
      if (unsubChats) unsubChats();
      unsubAuth();
    };
  }, []);

  // 🔄 LOADING
  if (loading) {
    return <div style={s.loader}>Loading Inbox...</div>;
  }

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h2>💜 Editor Inbox</h2>

        <button
          onClick={() => router.push("/editor")}
          style={s.back}
        >
          Dashboard
        </button>
      </div>

      {/* EMPTY */}
      {chats.length === 0 && (
        <div style={s.empty}>
          No clients yet 🚀
        </div>
      )}

      {/* CHAT LIST */}
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => router.push(`/chat/${chat.id}`)}
          style={s.card}
        >
          <div>
            <b>Client Chat</b>
            <p style={s.sub}>
              {chat.id.slice(0, 12)}
            </p>
          </div>

          {/* STATUS (INFO ONLY) */}
          <div
            style={{
              ...s.status,
              background: chat.unlocked ? "#10b981" : "#f59e0b"
            }}
          >
            {chat.unlocked ? "Paid" : "Pending"}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white"
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  back: {
    background: "#7c3aed",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    color: "white",
    cursor: "pointer"
  },

  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#aaa"
  },

  card: {
    padding: 15,
    marginBottom: 12,
    borderRadius: 15,
    background: "rgba(30,27,75,0.6)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.1)"
  },

  sub: {
    fontSize: 12,
    color: "#aaa"
  },

  status: {
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 12,
    color: "white"
  }
};