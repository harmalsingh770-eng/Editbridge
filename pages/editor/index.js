import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Editor() {
  const router = useRouter();

  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login?type=editor");

      const snap = await getDoc(doc(db, "editors", u.uid));
      if (!snap.exists()) {
        alert("Editor not found");
        return router.replace("/");
      }

      const data = snap.data();
      if (!data.approved) {
        alert("Wait for admin approval");
        return router.replace("/");
      }

      setEditor({ uid: u.uid, ...data });
      setPortfolio(data.portfolio || "");
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const savePortfolio = async () => {
    setSaving(true);
    await updateDoc(doc(db, "editors", editor.uid), { portfolio });
    setSaving(false);
    alert("Portfolio Updated ✅");
  };

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return (
      <div style={s.loaderPage}>
        <style>{css}</style>
        <div style={s.spinner}></div>
      </div>
    );
  }

  // Extract YouTube/Drive embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
    return null;
  };

  const embedUrl = getEmbedUrl(portfolio);

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* ✅ LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 8px 0" }}>Logout?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px 0" }}>
              Do you really want to logout and go to homepage?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutModal(false)} style={s.modalCancel}>
                Stay
              </button>
              <button onClick={confirmLogout} style={s.modalConfirm}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.heading}>🎬 Editor Dashboard</h1>
        <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      {/* PROFILE CARD */}
      <div style={s.card}>
        <div style={s.avatar}>{editor.name?.[0]?.toUpperCase() || "E"}</div>
        <div>
          <h2 style={s.name}>{editor.name}</h2>
          <p style={s.detail}>{editor.email}</p>
          <p style={s.detail}>Skills: {editor.skills?.join(", ") || "None"}</p>
          <p style={s.price}>₹{editor.price}</p>
        </div>
      </div>

      {/* PORTFOLIO */}
      <div style={s.card}>
        <h3 style={s.sectionTitle}>🎥 Portfolio Video</h3>
        <input
          value={portfolio}
          onChange={(e) => setPortfolio(e.target.value)}
          placeholder="Paste YouTube or Google Drive link"
          style={s.input}
        />

        {/* ✅ FIX: Use iframe embed instead of <video> for Drive/YouTube */}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            style={{ width: "100%", height: 200, borderRadius: 10, marginTop: 10, border: "none" }}
            allowFullScreen
          />
        ) : portfolio ? (
          <p style={{ color: "#f59e0b", fontSize: 13, marginTop: 8 }}>
            ⚠️ Paste a valid YouTube or Google Drive link
          </p>
        ) : null}

        <button style={s.saveBtn} onClick={savePortfolio} disabled={saving}>
          {saving ? "Saving..." : "Save Portfolio"}
        </button>
      </div>

      {/* INBOX BUTTON */}
      <button style={s.inboxBtn} onClick={() => router.push("/editor/inbox")}>
        📩 View Inbox
      </button>
    </div>
  );
}

const css = `
  body { margin: 0; font-family: sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: "100vh",
    padding: "0 0 40px 0",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },
  loaderPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #333",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "#1e293b",
    borderRadius: 16,
    padding: 24,
    width: 280,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  modalCancel: {
    flex: 1,
    padding: "10px 16px",
    background: "#334155",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  modalConfirm: {
    flex: 1,
    padding: "10px 16px",
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  heading: { margin: 0, fontSize: 18, fontWeight: 800 },
  logoutBtn: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  card: {
    background: "#1e293b",
    margin: "16px 16px 0",
    padding: 20,
    borderRadius: 16,
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#7c3aed,#6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 700,
    flexShrink: 0,
  },
  name: { margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 },
  detail: { margin: "2px 0", color: "#94a3b8", fontSize: 13 },
  price: { margin: "6px 0 0 0", color: "#a78bfa", fontWeight: 600 },
  sectionTitle: { margin: "0 0 12px 0", fontSize: 15, fontWeight: 700, width: "100%" },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0f172a",
    color: "white",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  saveBtn: {
    marginTop: 12,
    padding: "10px 20px",
    background: "#22c55e",
    border: "none",
    color: "white",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
  },
  inboxBtn: {
    display: "block",
    margin: "16px 16px 0",
    width: "calc(100% - 32px)",
    padding: 14,
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    textAlign: "center",
  },
};
