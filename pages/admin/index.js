import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, getDocs, updateDoc, deleteDoc, doc, onSnapshot
} from "firebase/firestore";

export default function Admin() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("payments");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); return; }
      if (user.email !== "admin@editbridge.com") { router.push("/"); return; }

      // Live payments listener
      const unsubPay = onSnapshot(collection(db, "payments"), (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      // Live editors listener
      const unsubEdit = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      return () => { unsubPay(); unsubEdit(); };
    });
    return () => unsub();
  }, []);

  const approvePayment = async (p) => {
    if (p.status === "approved") return alert("Already approved");
    await updateDoc(doc(db, "payments", p.id), { status: "approved" });
  };

  const rejectPayment = async (id) => {
    await updateDoc(doc(db, "payments", id), { status: "rejected" });
  };

  const approveEditor = async (id) => {
    await updateDoc(doc(db, "editors", id), { approved: true });
  };

  const toggleActive = async (id, current) => {
    await updateDoc(doc(db, "editors", id), { active: !current });
  };

  const deleteEditor = async (id) => {
    if (!confirm("Delete this editor?")) return;
    await deleteDoc(doc(db, "editors", id));
  };

  // FIXED: correct chat URL format
  const openChat = (editorId) => {
    router.push(`/chat/admin_${editorId}`);
  };

  if (loading) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.spinner} />
        <p style={{ color: "#94a3b8", marginTop: 14 }}>Loading Admin...</p>
      </div>
    );
  }

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const pendingEditors = editors.filter((e) => !e.approved);

  return (
    <>
      <style>{css}</style>
      <div style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.logoWrap}>
            <div style={s.logoIcon}>🛡️</div>
            <div>
              <div style={s.logoText}>Admin Panel</div>
              <div style={s.logoBadge}>EditBridge</div>
            </div>
          </div>
          <button onClick={() => { auth.signOut(); router.push("/"); }} style={s.logoutBtn}>
            Logout
          </button>
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: "Total Editors", value: editors.length, color: "#7c3aed" },
            { label: "Approved", value: editors.filter((e) => e.approved).length, color: "#10b981" },
            { label: "Pending Editors", value: pendingEditors.length, color: "#f59e0b" },
            { label: "Pending Payments", value: pendingPayments.length, color: "#ef4444" },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={{ ...s.statNum, color: st.color }}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === "payments" ? s.tabActive : {}) }} onClick={() => setTab("payments")}>
            💳 Payments {pendingPayments.length > 0 && <span style={s.badge}>{pendingPayments.length}</span>}
          </button>
          <button style={{ ...s.tab, ...(tab === "editors" ? s.tabActive : {}) }} onClick={() => setTab("editors")}>
            🎬 Editors {pendingEditors.length > 0 && <span style={s.badge}>{pendingEditors.length}</span>}
          </button>
        </div>

        <div style={s.content}>

          {/* Payments Tab */}
          {tab === "payments" && (
            <div>
              {payments.length === 0 ? (
                <div style={s.empty}>
                  <div style={{ fontSize: 36, opacity: 0.3 }}>💳</div>
                  <p style={{ color: "#475569", marginTop: 10 }}>No payments yet</p>
                </div>
              ) : (
                payments
                  .sort((a, b) => (a.status === "pending" ? -1 : 1))
                  .map((p) => (
                    <div key={p.id} style={s.card}>
                      <div style={s.cardTop}>
                        <div style={s.cardAvatar}>₹</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.cardTitle}>{p.email}</div>
                          <div style={s.cardSub}>Txn ID: {p.txnId}</div>
                          <div style={s.cardSub}>Amount: ₹{p.amount}</div>
                        </div>
                        <div style={{
                          ...s.statusBadge,
                          background: p.status === "approved" ? "rgba(16,185,129,0.15)" : p.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                          color: p.status === "approved" ? "#10b981" : p.status === "rejected" ? "#ef4444" : "#f59e0b",
                          border: `1px solid ${p.status === "approved" ? "rgba(16,185,129,0.3)" : p.status === "rejected" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                        }}>
                          {p.status}
                        </div>
                      </div>

                      {p.status === "pending" && (
                        <div style={s.btnRow}>
                          <button style={s.greenBtn} onClick={() => approvePayment(p)}>✓ Approve</button>
                          <button style={s.redBtn} onClick={() => rejectPayment(p.id)}>✕ Reject</button>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Editors Tab */}
          {tab === "editors" && (
            <div>
              {editors.length === 0 ? (
                <div style={s.empty}>
                  <div style={{ fontSize: 36, opacity: 0.3 }}>🎬</div>
                  <p style={{ color: "#475569", marginTop: 10 }}>No editors yet</p>
                </div>
              ) : (
                editors
                  .sort((a, b) => (a.approved ? 1 : -1))
                  .map((e) => (
                    <div key={e.id} style={s.card}>
                      <div style={s.cardTop}>
                        <div style={{ ...s.cardAvatar, background: "linear-gradient(135deg,#7c3aed,#3b82f6)" }}>
                          {(e.name?.[0] || "E").toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={s.cardTitle}>{e.name || "Unnamed"}</div>
                          <div style={s.cardSub}>{e.email}</div>
                          <div style={s.cardSub}>Skills: {Array.isArray(e.skills) ? e.skills.join(", ") : e.skill || "—"}</div>
                          <div style={s.cardSub}>Price: ₹{e.price} · {e.active ? "🟢 Online" : "⚫ Offline"}</div>
                        </div>
                        <div style={{
                          ...s.statusBadge,
                          background: e.approved ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                          color: e.approved ? "#10b981" : "#f59e0b",
                          border: `1px solid ${e.approved ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                        }}>
                          {e.approved ? "Approved" : "Pending"}
                        </div>
                      </div>

                      <div style={s.btnRow}>
                        {!e.approved && (
                          <button style={s.greenBtn} onClick={() => approveEditor(e.id)}>✓ Approve</button>
                        )}
                        <button style={s.blueBtn} onClick={() => openChat(e.id)}>💬 Chat</button>
                        <button style={s.purpleBtn} onClick={() => toggleActive(e.id, e.active)}>
                          {e.active ? "Turn Off" : "Turn On"}
                        </button>
                        <button style={s.redBtn} onClick={() => deleteEditor(e.id)}>🗑 Delete</button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  body { font-family: 'Segoe UI', system-ui, sans-serif; }
  button { cursor: pointer; transition: all 0.18s ease; }
  button:hover { filter: brightness(1.1); }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(160deg,#080d1a,#0f172a,#160a2a)", color: "white", paddingBottom: 60 },
  loadingScreen: { height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080d1a", color: "white" },
  spinner: { width: 32, height: 32, border: "3px solid rgba(124,58,237,0.15)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.75s linear infinite" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(8,13,26,0.9)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 20 },
  logoWrap: { display: "flex", alignItems: "center", gap: 11 },
  logoIcon: { width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  logoText: { fontWeight: 800, fontSize: 16 },
  logoBadge: { fontSize: 11, color: "#64748b", marginTop: 2 },
  logoutBtn: { padding: "8px 14px", background: "#ef4444", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontSize: 13 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, padding: "16px 20px" },
  statCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px", textAlign: "center" },
  statNum: { fontWeight: 800, fontSize: 26, letterSpacing: "-0.5px" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 4 },

  tabs: { display: "flex", gap: 8, padding: "0 20px 16px" },
  tab: { flex: 1, padding: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "#64748b", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  tabActive: { background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.3)", color: "#a78bfa" },
  badge: { background: "#ef4444", color: "white", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 },

  content: { padding: "0 20px" },
  empty: { textAlign: "center", padding: "60px 20px" },

  card: { background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px", marginBottom: 12 },
  cardTop: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  cardAvatar: { width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "white", flexShrink: 0 },
  cardTitle: { fontWeight: 700, fontSize: 14 },
  cardSub: { fontSize: 12, color: "#64748b", marginTop: 3 },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0 },

  btnRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  greenBtn: { padding: "8px 14px", background: "#10b981", border: "none", borderRadius: 9, color: "white", fontWeight: 600, fontSize: 12 },
  redBtn: { padding: "8px 14px", background: "#ef4444", border: "none", borderRadius: 9, color: "white", fontWeight: 600, fontSize: 12 },
  blueBtn: { padding: "8px 14px", background: "#3b82f6", border: "none", borderRadius: 9, color: "white", fontWeight: 600, fontSize: 12 },
  purpleBtn: { padding: "8px 14px", background: "#7c3aed", border: "none", borderRadius: 9, color: "white", fontWeight: 600, fontSize: 12 },
};