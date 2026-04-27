import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function ClientPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accessStatus, setAccessStatus] = useState(null); // null | "pending" | "approved" | "rejected"

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);

      try {
        // Check payment access
        const accessSnap = await getDoc(doc(db, "clientAccess", u.uid));
        if (accessSnap.exists()) {
          setAccessStatus(accessSnap.data().status); // "pending" | "approved" | "rejected"
        } else {
          setAccessStatus("none"); // never paid
        }

        // Load editors
        const snap = await getDocs(collection(db, "editors"));
        const approved = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.approved === true);
        setEditors(approved);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Live access status listener
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "clientAccess", user.uid), (snap) => {
      if (snap.exists()) setAccessStatus(snap.data().status);
      else setAccessStatus("none");
    });
    return () => unsub();
  }, [user]);

  const submitPayment = async () => {
    if (!txnId.trim()) return alert("Enter your transaction ID");
    setSubmitting(true);
    try {
      await addDoc(collection(db, "paymentRequests"), {
        uid: user.uid,
        email: user.email,
        txnId: txnId.trim(),
        amount: 10,
        status: "pending",
        createdAt: new Date(),
      });
      // Also update clientAccess to pending
      await import("firebase/firestore").then(({ setDoc }) =>
        setDoc(doc(db, "clientAccess", user.uid), {
          uid: user.uid,
          email: user.email,
          txnId: txnId.trim(),
          status: "pending",
          createdAt: new Date(),
        })
      );
      setShowPayModal(false);
      setTxnId("");
      alert("Payment submitted! Admin will verify and approve your access.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChatClick = (editorId) => {
    if (accessStatus === "approved") {
      router.push(`/chat/${user.uid}_${editorId}`);
    } else if (accessStatus === "pending") {
      alert("Your payment is under review. Please wait for admin approval.");
    } else if (accessStatus === "rejected") {
      setShowPayModal(true); // let them retry
    } else {
      setShowPayModal(true); // first time
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const filtered = editors.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name?.toLowerCase().includes(q) ||
      e.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.spinner} />
        <p style={{ color: "#94a3b8", marginTop: 14, fontSize: 14 }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={s.page}>

        {/* Payment Modal */}
        {showPayModal && (
          <div style={s.modalOverlay}>
            <div style={s.modal}>
              <div style={s.modalIcon}>💳</div>
              <h2 style={s.modalTitle}>Unlock Chat Access</h2>
              <p style={s.modalSub}>
                Pay <strong style={{ color: "#a78bfa" }}>₹10</strong> once to access all editor chats
              </p>

              <div style={s.upiBox}>
                <div style={s.upiLabel}>UPI ID</div>
                <div style={s.upiId}>editbridge@upi</div>
                <button
                  style={s.copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText("editbridge@upi");
                    alert("UPI ID copied!");
                  }}
                >
                  Copy
                </button>
              </div>

              <p style={s.modalStep}>After paying, enter your Transaction ID below:</p>

              <input
                placeholder="e.g. 123456789012"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                style={s.txnInput}
              />

              <button
                style={s.submitBtn}
                onClick={submitPayment}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit for Verification"}
              </button>

              <button
                style={s.cancelBtn}
                onClick={() => setShowPayModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Topbar */}
        <div style={s.topbar}>
          <div style={s.logoWrap}>
            <div style={s.logoIcon}>🎬</div>
            <div>
              <div style={s.logoText}>EditBridge</div>
              <div style={s.logoBadge}>Client Dashboard</div>
            </div>
          </div>

          <div style={s.topRight}>
            {/* Access badge */}
            {accessStatus === "approved" && (
              <div style={s.accessBadge("approved")}>✅ Access Active</div>
            )}
            {accessStatus === "pending" && (
              <div style={s.accessBadge("pending")}>⏳ Pending Approval</div>
            )}
            {(accessStatus === "none" || accessStatus === "rejected") && (
              <button style={s.unlockBtn} onClick={() => setShowPayModal(true)}>
                🔓 Unlock Chat — ₹10
              </button>
            )}
            <button onClick={() => router.push("/inbox")} style={s.inboxBtn}>
              📨 Inbox
            </button>
            <div style={s.emailPill}>{user?.email}</div>
            <button onClick={logout} style={s.logoutBtn}>Logout</button>
          </div>
        </div>

        {/* Hero */}
        <div style={s.hero}>
          <div style={s.heroGlow} />
          <h2 style={s.heroTitle}>Find Skilled Video Editors</h2>
          <p style={s.heroText}>
            Connect with talented editors, negotiate deals, and grow your content.
          </p>
          <div style={s.heroStats}>
            <div style={s.stat}>
              <div style={s.statNum}>{editors.length}</div>
              <div style={s.statLabel}>Editors</div>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <div style={s.statNum}>{editors.filter((e) => e.active).length}</div>
              <div style={s.statLabel}>Online Now</div>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <div style={s.statNum}>₹10</div>
              <div style={s.statLabel}>One-time Access</div>
            </div>
          </div>
        </div>

        {/* Access warning banner */}
        {accessStatus !== "approved" && (
          <div style={s.accessBanner}>
            <span>🔒 Pay ₹10 once to unlock chat with any editor</span>
            <button style={s.bannerBtn} onClick={() => setShowPayModal(true)}>
              Pay Now
            </button>
          </div>
        )}

        {/* Search */}
        <div style={s.searchWrap}>
          <span>🔍</span>
          <input
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        {/* Section */}
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>🔥 Marketplace Editors</h2>
          <span style={s.sectionCount}>{filtered.length} found</span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <p style={{ color: "#64748b", fontWeight: 600 }}>No editors found</p>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map((editor) => (
              <EditorCard
                key={editor.id}
                editor={editor}
                accessStatus={accessStatus}
                onChat={() => handleChatClick(editor.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EditorCard({ editor, accessStatus, onChat }) {
  const locked = accessStatus !== "approved";
  return (
    <div style={c.card} className="editor-card">
      <div style={c.cardTop}>
        <div style={c.avatarCircle}>
          {(editor.name?.[0] || "E").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={c.editorName}>{editor.name || "Unnamed Editor"}</div>
          <div style={{ fontSize: 11, fontWeight: 600, marginTop: 3, color: editor.active ? "#10b981" : "#64748b" }}>
            {editor.active ? "● Online" : "○ Offline"}
          </div>
        </div>
        <div style={c.priceBadge}>₹{editor.price || "?"}</div>
      </div>

      <div style={c.skillsRow}>
        {editor.skills?.length > 0
          ? editor.skills.slice(0, 4).map((skill, i) => (
              <span key={i} style={c.skillTag}>{skill}</span>
            ))
          : <span style={{ color: "#334155", fontSize: 12 }}>No skills listed</span>
        }
      </div>

      <button
        onClick={onChat}
        style={{
          ...c.chatBtn,
          background: locked
            ? "rgba(255,255,255,0.06)"
            : "linear-gradient(135deg,#8b5cf6,#7c3aed)",
          color: locked ? "#64748b" : "white",
          border: locked ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}
        className="chat-btn"
      >
        {locked ? "🔒 Unlock to Chat" : "💬 Chat Now"}
      </button>
    </div>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  body { font-family: 'Segoe UI', system-ui, sans-serif; }
  .editor-card { animation: fadeUp 0.3s ease both; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
  .editor-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(124,58,237,0.25) !important; border-color: rgba(124,58,237,0.35) !important; }
  .chat-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
  input:focus { outline: none; }
  input::placeholder { color: #475569; }
  button { cursor: pointer; transition: all 0.18s ease; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg,#080d1a 0%,#0f172a 50%,#160a2a 100%)",
    color: "white",
    paddingBottom: 60,
  },
  loadingScreen: {
    height: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#080d1a", color: "white",
  },
  spinner: {
    width: 32, height: 32,
    border: "3px solid rgba(124,58,237,0.15)",
    borderTopColor: "#7c3aed", borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },

  // Modal
  modalOverlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%", maxWidth: 400,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 22, padding: "30px 26px",
    display: "flex", flexDirection: "column", gap: 14,
    boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
  },
  modalIcon: { fontSize: 40, textAlign: "center" },
  modalTitle: { fontSize: 20, fontWeight: 800, textAlign: "center", letterSpacing: "-0.3px" },
  modalSub: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 },
  upiBox: {
    background: "rgba(124,58,237,0.1)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: 14, padding: "14px 16px",
    display: "flex", alignItems: "center", gap: 10,
  },
  upiLabel: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  upiId: { flex: 1, fontWeight: 700, fontSize: 15, color: "#a78bfa" },
  copyBtn: {
    padding: "6px 12px", background: "#7c3aed",
    border: "none", borderRadius: 8,
    color: "white", fontSize: 12, fontWeight: 600,
  },
  modalStep: { fontSize: 13, color: "#64748b" },
  txnInput: {
    padding: "12px 14px", borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "white", fontSize: 14,
  },
  submitBtn: {
    padding: "13px", borderRadius: 13, border: "none",
    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
    color: "white", fontWeight: 700, fontSize: 15,
    boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
  },
  cancelBtn: {
    padding: "11px", borderRadius: 13,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent", color: "#64748b", fontSize: 14,
  },

  // Topbar
  topbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(8,13,26,0.85)", backdropFilter: "blur(14px)",
    position: "sticky", top: 0, zIndex: 20, flexWrap: "wrap", gap: 10,
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 11 },
  logoIcon: {
    fontSize: 24, width: 42, height: 42, borderRadius: 13,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontWeight: 800, fontSize: 17, letterSpacing: "-0.4px" },
  logoBadge: { fontSize: 11, color: "#64748b", marginTop: 2 },
  topRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  accessBadge: (status) => ({
    fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
    background: status === "approved" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
    color: status === "approved" ? "#10b981" : "#f59e0b",
    border: `1px solid ${status === "approved" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
  }),
  unlockBtn: {
    padding: "7px 14px", background: "#7c3aed",
    border: "none", borderRadius: 10, color: "white",
    fontWeight: 600, fontSize: 12,
  },
  inboxBtn: {
    padding: "7px 14px", background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
    color: "white", fontWeight: 600, fontSize: 12,
  },
  emailPill: {
    fontSize: 11, color: "#94a3b8",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20, padding: "5px 12px",
  },
  logoutBtn: {
    padding: "7px 14px", background: "#ef4444",
    border: "none", borderRadius: 10, color: "white",
    fontWeight: 600, fontSize: 12,
  },

  // Access banner
  accessBanner: {
    margin: "0 20px 16px",
    padding: "12px 16px",
    background: "rgba(124,58,237,0.1)",
    border: "1px solid rgba(124,58,237,0.2)",
    borderRadius: 14,
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 10,
    fontSize: 13, color: "#a78bfa", flexWrap: "wrap",
  },
  bannerBtn: {
    padding: "7px 16px", background: "#7c3aed",
    border: "none", borderRadius: 9,
    color: "white", fontWeight: 700, fontSize: 13,
  },

  // Hero
  hero: {
    margin: "20px 20px 16px",
    padding: "24px 22px", borderRadius: 20,
    background: "rgba(124,58,237,0.08)",
    border: "1px solid rgba(124,58,237,0.15)",
    position: "relative", overflow: "hidden",
  },
  heroGlow: {
    position: "absolute", top: -60, right: -60,
    width: 180, height: 180, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)",
    pointerEvents: "none",
  },
  heroTitle: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8 },
  heroText: { color: "#94a3b8", fontSize: 13, lineHeight: 1.6, marginBottom: 18 },
  heroStats: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" },
  stat: { textAlign: "center" },
  statNum: { fontWeight: 800, fontSize: 20, color: "#a78bfa" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  statDivider: { width: 1, height: 28, background: "rgba(255,255,255,0.07)" },

  searchWrap: {
    margin: "0 20px 14px",
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 13, padding: "10px 15px",
  },
  searchInput: { flex: 1, background: "transparent", border: "none", color: "white", fontSize: 14 },
  sectionHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 20px", marginBottom: 14,
  },
  sectionTitle: { fontWeight: 700, fontSize: 16 },
  sectionCount: {
    fontSize: 12, color: "#64748b",
    background: "rgba(255,255,255,0.04)",
    padding: "3px 10px", borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.07)",
  },
  empty: { textAlign: "center", padding: "60px 20px", color: "white" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16, padding: "0 20px",
  },
};

const c = {
  card: {
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18, padding: "20px",
    display: "flex", flexDirection: "column", gap: 14,
  },
  cardTop: { display: "flex", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 13,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: 18, flexShrink: 0,
  },
  editorName: {
    fontWeight: 700, fontSize: 15, letterSpacing: "-0.2px",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  priceBadge: {
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.25)",
    color: "#a78bfa", fontWeight: 700, fontSize: 13,
    padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0,
  },
  skillsRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  skillTag: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#cbd5e1", fontSize: 11, padding: "3px 9px",
    borderRadius: 6, fontWeight: 500,
  },
  chatBtn: {
    width: "100%", padding: "12px", border: "none",
    borderRadius: 12, fontWeight: 700, fontSize: 14,
    letterSpacing: "-0.2px", cursor: "pointer",
  },
};