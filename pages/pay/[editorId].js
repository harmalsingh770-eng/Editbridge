"use client";

import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const UPI_ID = "yourupi@okaxis"; // CHANGE TO YOUR UPI ID

export default function Pay() {
  const router = useRouter();
  const { editorId } = router.query;

  const [txnId, setTxnId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");
    if (!txnId.trim()) return alert("Please enter your Transaction ID");

    setSubmitting(true);
    try {
      const chatId = [user.uid, editorId].sort().join("_");

      await addDoc(collection(db, "paymentRequests"), {
        uid: user.uid,
        email: user.email,
        editorId: editorId || "",
        chatId,
        txnId: txnId.trim(),
        status: "pending",
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (err) {
      alert("Error: " + err.message);
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.successCard}>
        <div style={s.tick}>✓</div>
        <h2 style={{ margin: "0 0 8px" }}>Submitted!</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px" }}>
          Admin will verify and unlock your chat shortly.
        </p>
        <button onClick={() => router.push("/client")} style={s.backBtn}>
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.card}>

        <button onClick={() => router.back()} style={s.topBack}>Back</button>

        <h2 style={s.title}>Unlock Chat</h2>
        <p style={s.subtitle}>Pay Rs.10 via UPI to chat with this editor</p>

        {/* QR */}
        <div style={s.qrWrap}>
          <img
            src="/qr.png"
            alt="Scan to Pay"
            style={s.qr}
            onError={e => { e.target.style.display = "none"; }}
          />
        </div>

        {/* UPI ID */}
        <div style={s.upiRow}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>UPI ID</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{UPI_ID}</div>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(UPI_ID); alert("Copied!"); }}
            style={s.copyBtn}
          >
            Copy
          </button>
        </div>

        <p style={s.label}>After paying, enter your Transaction / UTR ID:</p>

        <input
          placeholder="e.g. 423812345678"
          value={txnId}
          onChange={e => setTxnId(e.target.value)}
          style={s.input}
        />

        <button onClick={submit} style={s.submitBtn} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit for Approval"}
        </button>

      </div>
    </div>
  );
}

const css = "body { margin: 0; font-family: sans-serif; }";

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)", color: "white", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px", boxSizing: "border-box" },
  card: { width: "100%", maxWidth: 380, background: "#1e293b", borderRadius: 20, padding: 28, border: "1px solid rgba(255,255,255,0.08)", boxSizing: "border-box" },
  topBack: { background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "white", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 20 },
  title: { margin: "0 0 6px", fontSize: 22, fontWeight: 800, textAlign: "center" },
  subtitle: { color: "#94a3b8", fontSize: 14, textAlign: "center", margin: "0 0 20px" },
  qrWrap: { display: "flex", justifyContent: "center", background: "white", borderRadius: 14, padding: 14, marginBottom: 16 },
  qr: { width: 170, height: 170, objectFit: "contain" },
  upiRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", borderRadius: 12, padding: "12px 16px", marginBottom: 20 },
  copyBtn: { background: "#334155", border: "none", color: "white", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  label: { fontSize: 13, color: "#94a3b8", margin: "0 0 10px" },
  input: { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" },
  submitBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", color: "white", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" },
  successCard: { textAlign: "center", padding: 40, maxWidth: 320, margin: "0 auto" },
  tick: { width: 64, height: 64, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, margin: "0 auto 16px" },
  backBtn: { padding: "12px 28px", background: "#7c3aed", border: "none", color: "white", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 15 },
};