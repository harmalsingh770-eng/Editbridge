"use client";

import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const UPI_ID = "yourupi@okaxis"; // CHANGE THIS TO YOUR REAL UPI ID

export default function PayPage() {
  const router = useRouter();
  const { chatId } = router.query;

  const [txnId, setTxnId]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const submit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");
    if (!txnId.trim()) return alert("Please enter your Transaction ID after paying");

    setSubmitting(true);
    try {
      // chatId format: clientUid_editorUid (sorted)
      const parts = chatId ? chatId.split("_") : [];
      const editorId = parts.find(p => p !== user.uid) || "";

      await addDoc(collection(db, "paymentRequests"), {
        uid: user.uid,
        email: user.email,
        chatId: chatId || "",
        editorId,
        txnId: txnId.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      alert("Error: " + err.message);
      setSubmitting(false);
    }
  };

  // ─── SUCCESS SCREEN ─────────────────────────────────────
  if (submitted) return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.successCard}>
        <div style={s.tick}>✓</div>
        <h2 style={{ margin: "0 0 8px" }}>Submitted!</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 6px" }}>
          Your payment is under review.
        </p>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px" }}>
          Admin will verify and unlock your chat shortly.
        </p>
        <button onClick={() => router.push("/client")} style={s.backBtn}>
          Back to Home
        </button>
      </div>
    </div>
  );

  // ─── MAIN SCREEN ────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{css}</style>

      <div style={s.card}>

        {/* TOP BACK */}
        <button onClick={() => router.back()} style={s.topBack}>Back</button>

        <h2 style={s.title}>Unlock Chat</h2>
        <p style={s.subtitle}>Pay Rs.10 via UPI to start chatting with this editor</p>

        {/* AMOUNT BADGE */}
        <div style={s.amountBadge}>
          <span style={s.amountLabel}>Amount</span>
          <span style={s.amountValue}>Rs. 10</span>
        </div>

        {/* QR CODE */}
        <div style={s.qrSection}>
          <p style={s.qrLabel}>Scan QR to Pay</p>
          <div style={s.qrWrap}>
            <img
              src="/qr.png"
              alt="UPI QR Code"
              style={s.qr}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div style={{ ...s.qrFallback, display: "none" }}>
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center" }}>
                QR not found. Add qr.png to /public folder
              </p>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={s.divider}>
          <div style={s.dividerLine} />
          <span style={s.dividerText}>or pay manually</span>
          <div style={s.dividerLine} />
        </div>

        {/* UPI ID */}
        <div style={s.upiRow}>
          <div>
            <div style={s.upiLabel}>UPI ID</div>
            <div style={s.upiValue}>{UPI_ID}</div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(UPI_ID);
              alert("UPI ID copied!");
            }}
            style={s.copyBtn}
          >
            Copy
          </button>
        </div>

        {/* STEP 2 */}
        <div style={s.stepBox}>
          <div style={s.stepDot}>2</div>
          <p style={s.stepText}>After paying, enter your Transaction / UTR ID:</p>
        </div>

        <input
          placeholder="e.g. 423812345678"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          style={s.input}
        />

        <button
          onClick={submit}
          style={s.submitBtn}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit for Approval"}
        </button>

        <p style={s.note}>
          Once admin verifies your payment, the chat will unlock automatically.
        </p>

      </div>
    </div>
  );
}

const css = "body { margin: 0; font-family: sans-serif; }";

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)", color: "white", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "30px 16px", boxSizing: "border-box" },
  card: { width: "100%", maxWidth: 400, background: "#1e293b", borderRadius: 20, padding: 28, border: "1px solid rgba(255,255,255,0.08)", boxSizing: "border-box" },
  topBack: { background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "white", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 20 },
  title: { margin: "0 0 6px", fontSize: 22, fontWeight: 800, textAlign: "center" },
  subtitle: { color: "#94a3b8", fontSize: 13, textAlign: "center", margin: "0 0 20px" },

  amountBadge: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "12px 18px", marginBottom: 20 },
  amountLabel: { color: "#a78bfa", fontSize: 13, fontWeight: 600 },
  amountValue: { color: "#a78bfa", fontSize: 22, fontWeight: 800 },

  qrSection: { marginBottom: 16 },
  qrLabel: { fontSize: 12, color: "#94a3b8", textAlign: "center", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 },
  qrWrap: { display: "flex", justifyContent: "center", background: "white", borderRadius: 16, padding: 16, minHeight: 200, alignItems: "center" },
  qr: { width: 170, height: 170, objectFit: "contain" },
  qrFallback: { width: 170, height: 170, alignItems: "center", justifyContent: "center", padding: 10, boxSizing: "border-box" },

  divider: { display: "flex", alignItems: "center", gap: 10, margin: "16px 0" },
  dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.08)" },
  dividerText: { color: "#475569", fontSize: 12, whiteSpace: "nowrap" },

  upiRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", borderRadius: 12, padding: "12px 16px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)" },
  upiLabel: { fontSize: 11, color: "#94a3b8", marginBottom: 3, fontWeight: 600 },
  upiValue: { fontWeight: 700, fontSize: 15 },
  copyBtn: { background: "#334155", border: "none", color: "white", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 },

  stepBox: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  stepDot: { width: 24, height: 24, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 },
  stepText: { fontSize: 13, color: "#94a3b8", margin: 0 },

  input: { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" },
  submitBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", color: "white", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" },
  note: { fontSize: 12, color: "#475569", textAlign: "center", marginTop: 14, marginBottom: 0 },

  successCard: { textAlign: "center", padding: 40, maxWidth: 320, margin: "0 auto" },
  tick: { width: 64, height: 64, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, margin: "0 auto 16px", color: "white" },
  backBtn: { padding: "12px 28px", background: "#7c3aed", border: "none", color: "white", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 15 },
};