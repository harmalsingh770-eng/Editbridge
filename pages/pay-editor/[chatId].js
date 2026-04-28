"use client";

import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function PayEditor() {
  const router = useRouter();
  const { chatId } = router.query;

  const [txnId, setTxnId] = useState("");

  const submit = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const dealPrice = Number(prompt("Enter deal price"));
    if (!dealPrice) return;

    await addDoc(collection(db, "editorPayments"), {
      chatId,
      editorId: user.uid,
      dealPrice,
      commission: dealPrice * 0.1,
      txnId,
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Payment submitted");
    router.push("/editor");
  };

  return (
    <div style={{ padding: 20, color: "white", background: "#020617", minHeight: "100vh" }}>
      <h2>Pay 10% Commission</h2>

      <input
        placeholder="Transaction ID"
        value={txnId}
        onChange={(e) => setTxnId(e.target.value)}
      />

      <button onClick={submit}>Submit</button>
    </div>
  );
}