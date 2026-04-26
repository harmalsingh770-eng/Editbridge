import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function ChatPage() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [deal, setDeal] = useState(null);
  const [showDealBox, setShowDealBox] = useState(false);
  const [dealAmount, setDealAmount] = useState("");
  const [counterAmount, setCounterAmount] = useState("");
  const [showDealCard, setShowDealCard] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/client-login");
      else setUser(u);
    });
    return () => unsub();
  }, []);

  // Messages — NO orderBy, client-side sort (avoids composite index requirement)
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime() ?? 0;
          return aTime - bTime;
        });

      setMessages(msgs);
      setLoading(false);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  // Deal live
  useEffect(() => {
    if (!chatId) return;

    const unsub = onSnapshot(doc(db, "deals", chatId), (snap) => {
      if (snap.exists()) setDeal(snap.data());
      else setDeal(null);
    });

    return () => unsub();
  }, [chatId]);

  // Send Message
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        chatId,
        text: text.trim(),
        senderId: user.uid,
        senderEmail: user.email,
        createdAt: new Date(),
      });
      setText("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(e);
    }
  };

  // Create Deal
  const createDeal = async () => {
    if (!dealAmount) return alert("Enter amount");
    await setDoc(doc(db, "deals", chatId), {
      chatId,
      amount: Number(dealAmount),
      status: "pending",
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
    if (!confirm("Are you sure?")) return;
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
      const old = snap.data().earnings || 0;
      await updateDoc(ref, {
        earnings: old + deal.editorEarning,
        totalDeals: (snap.data().totalDeals || 0) + 1,
      });
    }
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return "";
    const date = createdAt?.toDate?.() ?? new Date(createdAt);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDealStatusColor = (status) => {
    const map = {
      pending: "#f59e0b",
      accepted: "#10b981",
      rejected: "#ef4444",
      countered: "#3b82f6",
      paid: "#8b5cf6",
    };
    return map[status] || "#94a3b8";
  };

  if (!chatId || !user) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.spinner} />
        <p style={{ color: "#94a3b8", marginTop: 16, fontSize: 14 }}>Connecting...</p>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <button style={s.iconBtn} onClick={() => router.back()} title="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>

          <div style={s.headerCenter}>
            <div style={s.avatar}>💬</div>
            <div>
              <div style={s.headerTitle}>Deal Chat</div>
              <div style={s.headerSub}>
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <button
            style={s.dealToggleBtn}
            onClick={() => setShowDealBox(!showDealBox)}
            className="deal-btn"
          >
            💼 Deal
          </button>
        </div>

        {/* Deal Create Box */}
        {showDealBox && (
          <div style={s.dealCreateBox} className="slide-down">
            <p style={s.dealCreateTitle}>Create Deal Offer</p>
            <div style={s.dealCreateRow}>
              <input
                placeholder="Amount in ₹"
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
                style={s.dealInput}
                type="number"
              />
              <button style={s.sendDealBtn} onClick={createDeal} className="pulse-btn">
                Send Offer
              </button>
            </div>
            <p style={s.dealFeeNote}>
              Platform: ₹{dealAmount ? (Number(dealAmount) * 0.1).toFixed(0) : "0"} &nbsp;|&nbsp;
              Editor earns: ₹{dealAmount ? (Number(dealAmount) * 0.9).toFixed(0) : "0"}
            </p>
          </div>
        )}

        {/* Deal Status Card */}
        {deal && (
          <div style={s.dealCard} className="slide-down">
            <div style={s.dealCardHeader}>
              <div style={s.dealCardLeft}>
                <span style={s.dealIcon}>💼</span>
                <div>
                  <div style={s.dealAmount}>₹{deal.amount}</div>
                  <div style={{ ...s.dealStatus, color: getDealStatusColor(deal.status) }}>
                    ● {deal.status.toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                style={s.collapseBtn}
                onClick={() => setShowDealCard(!showDealCard)}
              >
                {showDealCard ? "▲" : "▼"}
              </button>
            </div>

            {showDealCard && (
              <div style={s.dealDetails}>
                <div style={s.dealRow}>
                  <span style={s.dealLabel}>Platform Fee</span>
                  <span style={s.dealValue}>₹{deal.platformFee}</span>
                </div>
                <div style={s.dealRow}>
                  <span style={s.dealLabel}>Editor Earns</span>
                  <span style={s.dealValue}>₹{deal.editorEarning}</span>
                </div>

                {(deal.status === "pending" || deal.status === "countered") && (
                  <div style={s.dealActions}>
                    <button style={s.acceptBtn} onClick={acceptDeal} className="action-btn">
                      ✓ Accept
                    </button>
                    <button style={s.rejectBtn} onClick={rejectDeal} className="action-btn">
                      ✕ Reject
                    </button>
                    <div style={s.counterRow}>
                      <input
                        placeholder="Counter ₹"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        style={s.counterInput}
                        type="number"
                      />
                      <button style={s.counterBtn} onClick={counterOffer} className="action-btn">
                        ↩ Counter
                      </button>
                    </div>
                  </div>
                )}

                {deal.status === "accepted" && (
                  <button style={s.paidBtn} onClick={markPaid} className="action-btn">
                    💳 Mark Payment Received
                  </button>
                )}

                {deal.status === "paid" && (
                  <div style={s.paidBadge}>✅ Payment Confirmed</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div style={s.chatBox}>
          {loading ? (
            <div style={s.loadingMessages}>
              <div style={s.spinner} />
              <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>💬</div>
              <p style={s.emptyTitle}>No messages yet</p>
              <p style={s.emptySub}>Start the conversation below</p>
            </div>
          ) : (
            <>
              {messages.map((m, i) => {
                const mine = m.senderId === user.uid;
                const prevMsg = messages[i - 1];
                const showSender = !prevMsg || prevMsg.senderId !== m.senderId;

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: mine ? "flex-end" : "flex-start",
                      marginBottom: showSender ? "16px" : "4px",
                    }}
                    className="msg-appear"
                  >
                    {showSender && !mine && (
                      <span style={s.senderLabel}>{m.senderEmail}</span>
                    )}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: mine ? "row-reverse" : "row" }}>
                      {showSender && (
                        <div style={{ ...s.miniAvatar, background: mine ? "#7c3aed" : "#1e40af" }}>
                          {mine ? "Y" : m.senderEmail?.[0]?.toUpperCase()}
                        </div>
                      )}
                      {!showSender && <div style={{ width: 28 }} />}
                      <div
                        style={{
                          ...s.bubble,
                          background: mine
                            ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                            : "rgba(30, 41, 59, 0.9)",
                          borderBottomRightRadius: mine ? 4 : 18,
                          borderBottomLeftRadius: mine ? 18 : 4,
                          boxShadow: mine
                            ? "0 4px 20px rgba(124, 58, 237, 0.35)"
                            : "0 2px 10px rgba(0,0,0,0.3)",
                        }}
                      >
                        <div style={s.bubbleText}>{m.text}</div>
                        <div style={s.bubbleTime}>{formatTime(m.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={send} style={s.footer}>
          <div style={s.inputWrap}>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              style={s.input}
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            style={{
              ...s.sendBtn,
              opacity: !text.trim() || sending ? 0.5 : 1,
              transform: text.trim() ? "scale(1)" : "scale(0.95)",
            }}
            disabled={!text.trim() || sending}
            className="send-btn"
          >
            {sending ? (
              <div style={s.miniSpinner} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </>
  );
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; }

  .slide-down {
    animation: slideDown 0.25s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .msg-appear {
    animation: msgIn 0.2s ease;
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .deal-btn:hover { background: #d97706 !important; transform: scale(1.03); }
  .send-btn:hover:not(:disabled) { background: #6d28d9 !important; transform: scale(1.05) !important; }
  .action-btn:hover { filter: brightness(1.15); transform: scale(1.02); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  input::placeholder { color: #475569; }
  input:focus { outline: none; border-color: #7c3aed !important; }
  button { cursor: pointer; transition: all 0.18s ease; }
`;

const s = {
  page: {
    minHeight: "100vh",
    height: "100vh",
    background: "linear-gradient(160deg, #0a0f1e 0%, #0f172a 40%, #1a0a2e 100%)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
  },

  loadingScreen: {
    minHeight: "100vh",
    background: "#0a0f1e",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(124,58,237,0.2)",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  miniSpinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Header
  header: {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,15,30,0.8)",
    backdropFilter: "blur(12px)",
    flexShrink: 0,
    zIndex: 10,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },

  headerTitle: {
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: "-0.3px",
  },

  headerSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },

  dealToggleBtn: {
    padding: "8px 14px",
    background: "#f59e0b",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontWeight: 600,
    fontSize: 13,
  },

  // Deal Create
  dealCreateBox: {
    margin: "0 12px 0",
    padding: "14px 16px",
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.2)",
    borderRadius: "0 0 16px 16px",
    flexShrink: 0,
  },

  dealCreateTitle: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: 600,
    marginBottom: 10,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  dealCreateRow: {
    display: "flex",
    gap: 8,
  },

  dealInput: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: 14,
  },

  sendDealBtn: {
    padding: "10px 16px",
    background: "#f59e0b",
    border: "none",
    borderRadius: 12,
    color: "white",
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  dealFeeNote: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 8,
  },

  // Deal Card
  dealCard: {
    margin: "10px 12px 0",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.9)",
    overflow: "hidden",
    flexShrink: 0,
  },

  dealCardHeader: {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },

  dealCardLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  dealIcon: {
    fontSize: 22,
  },

  dealAmount: {
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-0.5px",
  },

  dealStatus: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "1px",
    marginTop: 2,
  },

  collapseBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 11,
  },

  dealDetails: {
    padding: "12px 16px",
  },

  dealRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  dealLabel: {
    fontSize: 12,
    color: "#64748b",
  },

  dealValue: {
    fontSize: 12,
    color: "#e2e8f0",
    fontWeight: 600,
  },

  dealActions: {
    marginTop: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },

  acceptBtn: {
    padding: "9px 16px",
    background: "#10b981",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600,
    fontSize: 13,
  },

  rejectBtn: {
    padding: "9px 16px",
    background: "#ef4444",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600,
    fontSize: 13,
  },

  counterRow: {
    display: "flex",
    gap: 8,
    width: "100%",
    marginTop: 4,
  },

  counterInput: {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: 13,
  },

  counterBtn: {
    padding: "9px 14px",
    background: "#3b82f6",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600,
 