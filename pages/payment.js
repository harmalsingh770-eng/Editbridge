"use client";

import { useRouter } from "next/router";
import { useState } from "react";
import { db } from "../lib/firebase";
import { addDoc, collection } from "firebase/firestore";

export default function Payment() {
  const router = useRouter();
  const { chatId } = router.query;

  const [txnId, setTxnId] = useState("");

  const submit = async () => {
    await addDoc(collection(db, "paymentRequests"), {
      chatId,
      txnId,
      status: "pending",
      createdAt: new Date()
    });

    alert("Sent for approval");
    router.push("/client");
  };

  return (
    <div style={s.page}>
      <h2>Pay ₹10</h2>
      <p>UPI: yourupi@okaxis</p>

      <input onChange={(e) => setTxnId(e.target.value)} placeholder="Txn ID"/>
      <button onClick={submit}>Submit</button>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "#020617",
    color: "white"
  }
};