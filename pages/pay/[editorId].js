import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

export default function Payment() {
  const router = useRouter();
  const { editorId } = router.query;

  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ FIXED AMOUNT
  const amount = 10;

  // ✅ UPI LINK
  const upiLink = `upi://pay?pa=yourupi@upi&pn=EditBridge&am=${amount}&cu=INR`;

  const submit = async () => {
    if (!txnId) return alert("Enter transaction ID");
    if (!auth.currentUser) return alert("Login required");

    setLoading(true);

    try {
      await addDoc(collection(db, "paymentRequests"), {
        uid: auth.currentUser.uid,
        editorId: editorId,
        txnId: txnId,
        status: "pending", // ✅ STRING (important)
        createdAt: serverTimestamp()
      });

      alert("Payment submitted. Wait for admin approval.");
      router.push("/client");

    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={s.title}>🔒 Unlock Chat</h2>

        <p style={s.subtitle}>
          Pay ₹{amount} to start chatting with editor
        </p>

        {/* ✅ UPI BUTTON */}
        <a href={upiLink} style={s.upiBtn}>
          Open UPI App
        </a>

        <p style={s.note}>After payment, paste transaction ID below</p>

        <input
          placeholder="Enter Transaction ID"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          style={s.input}
        />

        <button onClick={submit} style={s.btn} disabled={loading}>
          {loading ? "Submitting..." : "Submit Payment"}
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white"
  },

  card: {
    width: 320,
    padding: 25,
    borderRadius: 16,
    background: "rgba(30,27,75,0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)"
  },

  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 10
  },

  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 15
  },

  upiBtn: {
    display: "block",
    textAlign: "center",
    padding: 12,
    borderRadius: 10,
    background: "#22c55e",
    color: "white",
    textDecoration: "none",
    marginBottom: 10,
    fontWeight: 600
  },

  note: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8
  },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "none",
    marginBottom: 10,
    outline: "none"
  },

  btn: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#7c3aed",
    color: "white",
    fontWeight: 700
  }
};