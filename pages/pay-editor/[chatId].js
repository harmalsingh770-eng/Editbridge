"use client";

import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function EditorPay() {
  const [dealId, setDealId] = useState("");
  const [amount, setAmount] = useState("");
  const [txnId, setTxnId] = useState("");

  const submit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");

    if (!dealId || !amount || !txnId) {
      return alert("Fill all fields");
    }

    await addDoc(collection(db, "editorPayments"), {
      editorId: user.uid,
      dealId,
      amount: Number(amount),
      txnId,
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Payment submitted");
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2>Pay 10% Commission</h2>

        <input
          placeholder="Deal ID"
          value={dealId}
          onChange={e => setDealId(e.target.value)}
          style={s.input}
        />

        <input
          placeholder="Amount (10%)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={s.input}
        />

        <input
          placeholder="Transaction ID"
          value={txnId}
          onChange={e => setTxnId(e.target.value)}
          style={s.input}
        />

        <button onClick={submit} style={s.btn}>
          Submit Payment
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
    background: "#1e293b",
    padding: 30,
    borderRadius: 16,
    width: 300
  },
  input: {
    width: "100%",
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    border: "none"
  },
  btn: {
    width: "100%",
    padding: 12,
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 10
  }
};