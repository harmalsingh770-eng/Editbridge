import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Find all messages involving this user, get unique chatIds
    const q = query(
      collection(db, "messages"),
      where("chatId", ">=", ""),   // fetch all, filter client-side
    );

    const unsub = onSnapshot(q, async (snap) => {
      // Get unique chatIds where this user is a participant
      const chatIdSet = new Set();
      snap.docs.forEach((d) => {
        const cid = d.data().chatId;
        if (cid && cid.includes(user.uid)) {
          chatIdSet.add(cid);
        }
      });

      // For each chatId, resolve names and last message
      const chatList = await Promise.all(
        Array.from(chatIdSet).map(async (chatId) => {
          // chatId format: clientUid_editorId
          const parts = chatId.split("_");
          const editorId = parts[parts.length - 1];
          const clientId = parts[0];

          // Get last message for preview
          const msgs = snap.docs
            .filter((d) => d.data().chatId === chatId)
            .map((d) => d.data())
            .sort((a, b) => {
              const aT = a.createdAt?.toMillis?.() ?? 0;
              const bT = b.createdAt?.toMillis?.() ?? 0;
              return bT - aT;
            });

          const lastMsg = msgs[0];
          const unread = msgs.length;

          // Resolve editor name
          let editorName = editorId;
          let editorInitial = "?";
          try {
            const editorSnap = await getDoc(doc(db, "editors", editorId));
            if (editorSnap.exists()) {
              editorName = editorSnap.data().name || editorId;
              editorInitial = editorName[0]?.toUpperCase() || "E";
            }
          } catch (_) {}

          return {
            chatId,
            editorId,
            clientId,
            editorName,
            editorInitial,
            lastMessage: lastMsg?.text || "No messages yet",
            lastTime: lastMsg?.createdAt,
            count: unread,
          };
        })
      );

      // Sort by most recent message
      chatList.sort((a, b) => {
        const aT = a.lastTime?.toMillis?.() ?? 0;
        const bT = b.lastTime?.toMillis?.() ?? 0;
        return bT - aT;
      });

      setChats(chatList);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.spinner} />
        <p style={{ color: "#94a3b8", marginTop: 14, fontSize: 14 }}>
          Loading inbox...
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={s.page}>

        {/* ── Header ── */}
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <div style={s.headerTitle}>📨 Inbox</div>
            <div style={s.headerSub}>{chats.length} conversation{chats.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {/* ── Chat List ── */}
        <div style={s.list}>
          {chats.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.3 }}>📭</div>
              <p style={{ color: "#475569", fontWeight: 600 }}>No conversations yet</p>
              <p style={{ color: "#334155", fontSize: 13, marginTop: 4 }}>
                Start chatting with an editor
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.chatId}
                style={s.chatRow}
                className="chat-row"
                onClick={() => router.push(`/chat/${chat.chatId}`)}
              >
                <div style={s.chatAvatar}>
                  {chat.editorInitial}
                </div>

                <div style={s.chatInfo}>
                  <div style={s.chatName}>{chat.editorName}</div>
                  <div style={s.chatPreview}>{chat.lastMessage}</div>
                </div>

                <div style={s.chatMeta}>
                  <div style={s.chatTime}>{formatTime(chat.lastTime)}</div>
                  <div style={s.chatCount}>{chat.count}</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  body { font-family: 'Segoe UI', system-ui, sans-serif; }

  .chat-row {
    animation: fadeUp 0.2s ease both;
  }
  .chat-row:hover {
    background: rgba(124,58,237,0.08) !important;
    border-color: rgba(124,58,237,0.2) !important;
  }
  button { cursor: pointer; transition: all 0.15s ease; }
  button:hover { filter: brightness(1.1); }
`;

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg,#080d1a 0%,#0f172a 50%,#160a2a 100%)",
    color: "white",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  loadingScreen: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#080d1a",
    color: "white",
  },

  spinner: {
    width: 30,
    height: 30,
    border: "3px solid rgba(124,58,237,0.15)",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(8,13,26,0.85)",
    backdropFilter: "blur(14px)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  backBtn: {
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    flexShrink: 0,
  },

  headerTitle: {
    fontWeight: 700,
    fontSize: 17,
  },

  headerSub: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },

  list: {
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  chatRow: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: "14px 15px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15,23,42,0.8)",
    cursor: "pointer",
    transition: "background 0.18s, border-color 0.18s",
  },

  chatAvatar: {
    width: 46,
    height: 46,
    borderRadius: 13,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
    color: "white",
    flexShrink: 0,
  },

  chatInfo: {
    flex: 1,
    minWidth: 0,
  },

  chatName: {
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  chatPreview: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  chatMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 5,
    flexShrink: 0,
  },

  chatTime: {
    fontSize: 10,
    color: "#475569",
  },

  chatCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    background: "#7c3aed",
    color: "white",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px",
  },

  empty: {
    textAlign: "center",
    padding: "80px 20px",
  },
};