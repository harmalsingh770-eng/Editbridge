"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import Reviews from "../components/Reviews";

export default function Client() {
  const [editors, setEditors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [user, setUser]             = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login?type=client");
      setUser(u);

      const snap = await getDocs(collection(db, "editors"));
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.approved && e.active);
      setEditors(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const startChat = async (editorId) => {
    if (!user) return router.push("/login?type=client");
    const chatId = [user.uid, editorId].sort().join("_");
    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        clientId: user.uid,
        editorId,
        users: [user.uid, editorId],
        unlocked: false,
        createdAt: new Date(),
      });
    }
    router.push(`/chat/${chatId}`);
  };

  const confirmLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return (
    <div style={s.loaderPage}>
      <style>{css}</style>
      <div style={s.spinner}></div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 8px" }}>Logout?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
              Do you really want to logout?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogout(false)} style={s.mStay}>Stay</button>
              <button onClick={confirmLogout} style={s.mLeave}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <span style={s.logo}>EditBridge</span>
        <button onClick={() => setShowLogout(true)} style={s.logoutBtn}>Logout</button>
      </div>

      {/* HERO */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>Find Your Editor</h1>
        <p style={s.heroSub}>{editors.length} editor{editors.length !== 1 ? "s" : ""} available</p>
      </div>

      {/* EDITORS */}
      <div style={s.grid}>
        {editors.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>ðŸ”</div>
            <p>No editors available right now</p>
          </div>
        )}

        {editors.map(e => (
          <div key={e.id} style={s.card}>

            {/* TOP ROW */}
            <div style={s.cardTop}>
              <div style={s.avatar}>{e.name?.[0]?.toUpperCase() || "E"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.editorName}>{e.name || "Editor"}</div>
                <div style={s.editorEmail}>{e.email || ""}</div>
              </div>
              <span style={{ ...s.statusDot, background: e.active ? "#22c55e" : "#ef4444" }}>
                {e.active ? "Online" : "Offline"}
              </span>
            </div>

            {/* BIO */}
            {e.bio && <p style={s.bio}>{e.bio}</p>}

            {/* SKILLS */}
            {e.skills?.length > 0 && (
              <div style={s.tagsRow}>
                {e.skills.map((sk, i) => (
                  <span key={i} style={s.tag}>{sk}</span>
                ))}
              </div>
            )}

            {/* PRICE */}
            <div style={s.priceBadge}>Rs. {e.price || 0}</div>

            {/* PORTFOLIO */}
            {e.portfolioLink && (
              <a href={e.portfolioLink} target="_blank" rel="noreferrer" style={s.portfolioLink}>
                View Portfolio
              </a>
            )}

            {/* REVIEWS */}
            <Reviews editorId={e.id} />

            {/* CHAT BUTTON */}
            <button onClick={() => startChat(e.id)} style={s.chatBtn}>
              Pay to Chat â€” Rs.10
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}

const css = `
  body { margin: 0; font-family: sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)", color: "white", paddingBottom: 40 },
  loaderPage: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#020617" },
  spinner: { width: 34, height: 34, border: "3px solid #333", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#1e293b", borderRadius: 16, padding: 24, width: 280, textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" },
  mStay: { flex: 1, padding: "10px 16px", background: "#334155", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },
  mLeave: { flex: 1, padding: "10px 16px", background: "#ef4444", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  logo: { fontWeight: 800, fontSize: 18 },
  logoutBtn: { background: "#ef4444", border: "none", color: "white", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },

  hero: { padding: "24px 20px 8px" },
  heroTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 800 },
  heroSub: { margin: 0, color: "#94a3b8", fontSize: 14 },

  grid: { padding: 16, display: "flex", flexDirection: "column", gap: 14 },
  empty: { textAlign: "center", padding: 40, color: "#475569" },

  card: { background: "#1e293b", borderRadius: 18, padding: 20, border: "1px solid rgba(255,255,255,0.06)" },
  cardTop: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, flexShrink: 0 },
  editorName: { fontWeight: 700, fontSize: 16 },
  editorEmail: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  statusDot: { padding: "4px 10px", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 600, flexShrink: 0 },

  bio: { color: "#cbd5e1", fontSize: 13, lineHeight: 1.5, margin: "0 0 12px" },

  tagsRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tag: { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa", padding: "3px 10px", borderRadius: 20, fontSize: 12 },

  priceBadge: { display: "inline-block", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 12 },

  portfolioLink: { display: "block", color: "#818cf8", fontSize: 13, marginBottom: 12, textDecoration: "none", fontWeight: 500 },

  chatBtn: { width: "100%", padding: 13, background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", color: "white", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 12 },
};