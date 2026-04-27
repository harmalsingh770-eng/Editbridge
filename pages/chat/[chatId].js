import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, addDoc, query, where, onSnapshot,
  doc, setDoc, getDoc, updateDoc,
} from "firebase/firestore";

export default function ChatPage() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessOk, setAccessOk] = useState(null); // null=checking, true, false

  const [deal, setDeal] = useState(null);
  const [showDealBox, setShowDealBox] = useState(false);
  const [dealAmount, setDealAmount] = useState("");
  const [counterAmount, setCounterAmount] = useState("");
  const [showDealCard, setShowDealCard] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auth â€” FIXED: redirect to /login not /client-login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Payment gate â€” check if user has approved payment OR is admin/editor
  useEffect(() => {
    if (!user || !chatId) return;

    const isAdmin = user.email === "admin@editbridge.com";

    // Editors and admin always have access
    if (isAdmin || chatId.includes("admin_")) {
      setAccessOk(true);
      return;
    }

    // Check if this chatId belongs to the user
    if (!chatId.startsWith(user.uid)) {
      // Could be editor accessing their own chat
      const q = query(collection(db, "payments"), where("userId", "==", user.uid));
      const unsub = onSnapshot(q, (snap) => {
        const approved = snap.docs.some((d) => d.data().status === "approved");
        setAccessOk(approved);
        if (!approved) {
          alert("ðŸ”’ Chat access requires payment approval.");
          router.push("/client");
        }
      });
      return () => unsub();
    }

    // Client checking their own chatId
    const q = query(collection(db, "payments"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const approved = snap.docs.some((d) => d.data().status === "approved");
      setAccessOk(approved);
      if (!approved) {
        alert("ðŸ”’ Your payment hasn't been approved yet.");
        router.push("/client");
      }
    });
    return () => unsub();
  }, [user, chatId]);

  // Messages
  useEffect(() => {
    if (!chatId || !accessOk) return;
    const q = query(collection(db, "messages"), where("chatId", "==", chatId));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aT = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime() ?? 0;
          const bT = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime() ?? 0;
          return aT - bT;
        });
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [chatId, accessOk]);

  // Deal
  useEffect(() => {
    if (!chatId || !accessOk) return;
    const unsub = onSnapshot(doc(db, "deals", chatId), (snap) => {
      setDeal(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, [chatId, accessOk]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        chatId, text: text.trim(),
        senderId: user.uid, senderEmail: user.email,
        createdAt: new Date(),
      });
      setText("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); }
  };

  const createDeal = async () => {
    if (!dealAmount) return alert("Enter amount");
    await setDoc(doc(db, "deals", chatId), {
      chatId, amount: Number(dealAmount), status: "pending",
      requestedBy: user.email,
      platformFee: Number(dealAmount) * 0.1,
      editorEarning: Number(dealAmount) * 0.9,
      createdAt: new Date(),
    });
    setShowDealBox(false);
    setDealAmount("");
  };

  const acceptDeal = async () => {
    if (!confirm("Accept this deal?")) return;
    if (!confirm("Final confirmation?")) return;
    await updateDoc(doc(db, "deals", chatId), { status: "accepted" });
  };

  const rejectDeal = async () => {
    if (!confirm("Reject deal?")) return;
    await updateDoc(doc(db, "deals", chatId), { status: "rejected" });
  };

  const counterOffer = async () => {
    if (!counterAmount) return;
    await updateDoc(doc(db, "deals", chatId), {
      amount: Number(counterAmount),
      platformFee: Number(counterAmount) * 0.1,
      editorEarning: Number(counterAmount) * 0.9,
      status: "countered",
    });
    setCounterAmount("");
  };

  const markPaid = async () => {
    await updateDoc(doc(db, "deals", chatId), { status: "paid" });
    const editorId = chatId.split("_").pop();
    const ref = doc(db, "editors", editorId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        earnings: (snap.data().earnings || 0) + deal.editorEarning,
        totalDeals: (snap.data().totalDeals || 0) + 1,
      });
    }
  };

  const fmt = (createdAt) => {
    if (!createdAt) return "";
    const d = createdAt?.toDate?.() ?? new Date(createdAt);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const statusColor = { pending: "#f59e0b", accepted: "#10b981", rejected: "#ef4444", countered: "#3b82f6", paid: "#8b5cf6" };

  if (!chatId || !user || accessOk === null) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.spinner} />
        <p style={{ color: "#94a3b8", marginTop: 14, fontSize: 13 }}>Connecting...</p>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <button style={s.iconBtn} onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div style={s.headerCenter}>
            <div style={s.avatar}>ðŸ’¬</div>
            <div>
              <div style={s.headerTitle}>Deal Chat</div>
              <div style={s.headerSub}>{messages.length} message{messages.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
          <button style={s.dealToggleBtn} onClick={() => setShowDealBox(!showDealBox)}>
            ðŸ’¼ Deal
          </button>
        </div>

        {/* Deal Create */}
        {showDealBox && (
          <div style={s.dealCreateBox}>
            <p style={s.dealCreateTitle}>Create Deal Offer</p>
            <div style={s.dealCreateRow}>
              <input placeholder="Amount â‚¹" value={dealAmount} onChange={(e) => setDealAmount(e.target.value)} style={s.dealInput} type="number" />
              <button style={s.sendDealBtn} onClick={createDeal}>Send Offer</button>
            </div>
            <p style={s.dealFeeNote}>
              Platform: â‚¹{dealAmount ? (Number(dealAmount) * 0.1).toFixed(0) : "0"} Â· Editor: â‚¹{dealAmount ? (Number(dealAmount) * 0.9).toFixed(0) : "0"}
            </p>
          </div>
        )}

        {/* Deal Card */}
        {deal && (
          <div style={s.dealCard}>
            <div style={s.dealCardHeader}>
              <div style={s.dealCardLeft}>
                <span style={{ fontSize: 20 }}>ðŸ’¼</span>
                <div>
                  <div style={s.dealAmt}>â‚¹{deal.amount}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", marginTop: 2, color: statusColor[deal.status] || "#94a3b8" }}>
                    â— {deal.status?.toUpperCase()}
                  </div>
                </div>
              </div>
              <button style={s.collapseBtn} onClick={() => setShowDealCard(!showDealCard)}>
                {showDealCard ? "â–²" : "â–¼"}
              </button>
            </div>

            {showDealCard && (
              <div style={s.dealDetails}>
                <div style={s.dealRow}><span style={s.dealLabel}>Platform Fee</span><span style={s.dealValue}>â‚¹{deal.platformFee}</span></div>
                <div style={s.dealRow}><span style={s.dealLabel}>Editor Earns</span><span style={s.dealValue}>â‚¹{deal.editorEarning}</span></div>

                {(deal.status === "pending" || deal.status === "countered") && (
                  <div style={s.dealActions}>
                    <button style={s.acceptBtn} onClick={acceptDeal}>âœ“ Accept</button>
                    <button style={s.rejectBtn} onClick={rejectDeal}>âœ• Reject</button>
                    <div style={s.counterRow}>
                      <input placeholder="Counter â‚¹" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} style={s.counterInput} type="number" />
                      <button style={s.counterBtn} onClick={counterOffer}>â†© Counter</button>
                    </div>
                  </div>
                )}
                {deal.status === "accepted" && (
                  <button style={s.paidBtn} onClick={markPaid}>ðŸ’³ Mark Payment Received</button>
                )}
                {deal.status === "paid" && (
                  <div style={s.paidBadge}>âœ… Payment Confirmed</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div style={s.chatBox}>
          {loading ? (
            <div style={s.centered}><div style={s.spinner} /></div>
          ) : messages.length === 0 ? (
            <div style={s.centered}>
              <div style={{ fontSize: 44, opacity: 0.3 }}>ðŸ’¬</div>
              <p style={{ color: "#475569", marginTop: 10, fontWeight: 600 }}>No messages yet</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const mine = m.senderId === user.uid;
              const prev = messages[i - 1];
              const showMeta = !prev || prev.senderId !== m.senderId;
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", marginBottom: showMeta ? 14 : 3 }} className="msg-in">
                  {showMeta && !mine && <span style={s.senderLabel}>{m.senderEmail}</span>}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 7, flexDirection: mine ? "row-reverse" : "row" }}>
                    {showMeta ? (
                      <div style={{ ...s.miniAvatar, background: mine ? "#7c3aed" : "#1e40af" }}>
                        {mine ? "Y" : (m.senderEmail?.[0] || "?").toUpperCase()}
                      </div>
                    ) : <div style={{ width: 28 }} />}
                    <div style={{
                      padding: "10px 14px", borderRadius: 18, maxWidth: "72%", wordBreak: "break-word",
                      borderBottomRightRadius: mine ? 4 : 18, borderBottomLeftRadius: mine ? 18 : 4,
                      background: mine ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(30,41,59,0.9)",
                      boxShadow: mine ? "0 4px 20px rgba(124,58,237,0.3)" : "0 2px 10px rgba(0,0,0,0.25)",
                    }}>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: "#f1f5f9" }}>{m.text}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4, textAlign: "right" }}>{fmt(m.createdAt)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={send} style={s.footer}>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={s.input}
            disabled={sending}
            autoComplete="off"
          />
          <button type="submit" disabled={!text.trim() || sending} style={{ ...s.sendBtn, opacity: !text.trim() || sending ? 0.45 : 1 }}>
            {sending ? <div style={s.miniSpinner} /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes msgIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  body { font-family: 'Segoe UI', system-ui, sans-serif; }
  .msg-in { animation: msgIn 0.2s ease; }
  input:focus { outline: none; border-color: #7c3aed !important; }
  input::placeholder { color: #475569; }
  button { cursor: pointer; transition: all 0.18s ease; }
  button:hover:not(:disabled) { filter: brightness(1.1); }
  button:active:not(:disabled) { transform: scale(0.97); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
`;

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(160deg,#080d1a,#0f172a,#160a2a)", color: "white", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  loadingScreen: { height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080d1a", color: "white" },
  spinner: { width: 30, height: 30, border: "3px solid rgba(124,58,237,0.15)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.75s linear infinite" },
  miniSpinner: { width: 17, height: 17, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.75s linear infinite" },
  centered: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60 },

  header: { flexShrink: 0, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,13,26,0.85)", backdropFilter: "blur(14px)", zIndex: 10 },
  iconBtn: { width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "white" },
  headerCenter: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 },
  headerTitle: { fontWeight: 700, fontSize: 14 },
  headerSub: { fontSize: 11, color: "#475569", marginTop: 1 },
  dealToggleBtn: { padding: "8px 13px", background: "#f59e0b", border: "none", borderRadius: 11, color: "white", fontWeight: 600, fontSize: 13 },

  dealCreateBox: { flexShrink: 0, margin: "0 12px", padding: "13px 15px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: "0 0 14px 14px", animation: "slideDown 0.2s ease" },
  dealCreateTitle: { fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 },
  dealCreateRow: { display: "flex", gap: 8 },
  dealInput: { flex: 1, padding: "9px 13px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14 },
  sendDealBtn: { padding: "9px 15px", background: "#f59e0b", border: "none", borderRadius: 11, color: "white", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" },
  dealFeeNote: { fontSize: 11, color: "#64748b", marginTop: 8 },

  dealCard: { flexShrink: 0, margin: "10px 12px 0", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,20,38,0.95)", overflow: "hidden" },
  dealCardHeader: { padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  dealCardLeft: { display: "flex", alignItems: "center", gap: 11 },
  dealAmt: { fontWeight: 800, fontSize: 17, letterSpacing: "-0.5px" },
  collapseBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b", borderRadius: 7, padding: "3px 9px", fontSize: 11 },
  dealDetails: { padding: "11px 14px" },
  dealRow: { display: "flex", justifyContent: "space-between", marginBottom: 5 },
  dealLabel: { fontSize: 12, color: "#475569" },
  dealValue: { fontSize: 12, color: "#cbd5e1", fontWeight: 600 },
  dealActions: { marginTop: 11, display: "flex", flexWrap: "wrap", gap: 7 },
  acceptBtn: { padding: "8px 15px", background: "#10b981", border: "none", borderRadius: 9, color: "white", fontWeight: 600, fontSize: 13 },
  rejectBtn: { padding: "8px 15px", background: "#ef4444", border: "none", borderRadius: 9, color: "white", fontWeight: 600, fontSize: 13 },
  counterRow: { display: "flex", gap: 7, width: "100%", marginTop: 3 },
  counterInput: { flex: 1, padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 13 },
  counterBtn: { padding: "8px 13px", background: "#3b82f6", border: "none", borderRadius: 9, color: "white", fontWeight: 600, fontSize: 13 },
  paidBtn: { marginTop: 10, width: "100%", padding: "11px", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 11, color: "white", fontWeight: 700, fontSize: 14 },
  paidBadge: { marginTop: 10, padding: "10px", textAlign: "center", background: "rgba(16,185,129,0.09)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 9, color: "#10b981", fontWeight: 700, fontSize: 13 },

  chatBox: { flex: 1, overflowY: "auto", padding: "14px 14px 6px" },
  senderLabel: { fontSize: 10, color: "#475569", marginBottom: 3, marginLeft: 35, letterSpacing: "0.2px" },
  miniAvatar: { width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 },

  footer: { flexShrink: 0, display: "flex", gap: 9, padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(8,13,26,0.9)", backdropFilter: "blur(14px)" },
  input: { flex: 1, padding: "12px 15px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, transition: "border-color 0.2s" },
  sendBtn: { width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "white", boxShadow: "0 4px 14px rgba(124,58,237,0.38)", transition: "opacity 0.2s" },
};