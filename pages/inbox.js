import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Inbox() {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let unsubChats;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");

      setUser(u);

      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", u.uid)
      );

      unsubChats = onSnapshot(q, (snap) => {
        let data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // SORT latest first
        data.sort(
          (a, b) =>
            (b.lastMessageAt?.seconds || 0) -
            (a.lastMessageAt?.seconds || 0)
        );

        setChats(data);
      });
    });

    return () => {
      unsubAuth();
      if (unsubChats) unsubChats();
    };
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.back}>
          ←
        </button>
        <h2>Inbox</h2>
      </div>

      {chats.length === 0 ? (
        <div style={s.empty}>No chats yet</div>
      ) : (
        chats.map((c) => {
          const time = c.lastMessageAt?.toDate?.();

          return (
            <div
              key={c.id}
              onClick={() => router.push(`/chat/${c.id}`)}
              style={s.chat}
            >
              <div style={s.avatar}>
                {c.lastSender?.[0]?.toUpperCase() || "U"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={s.topRow}>
                  <div style={s.name}>
                    {c.lastSender || "Unknown"}
                  </div>

                  <div style={s.time}>
                    {time
                      ? time.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>

                <div style={s.message}>
                  {c.lastMessage || "No messages yet"}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* 🎨 UI */
const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
    padding: 16,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },

  back: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 18,
  },

  empty: {
    textAlign: "center",
    marginTop: 100,
    color: "#64748b",
  },

  chat: {
    display: "flex",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    marginBottom: 10,
    cursor: "pointer",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
  },

  name: {
    fontWeight: 700,
    fontSize: 14,
  },

  time: {
    fontSize: 11,
    color: "#64748b",
  },

  message: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
};