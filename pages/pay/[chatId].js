"use client";

import { useRouter } from "next/router";
import { db } from "../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function PayPage() {
  const router = useRouter();
  const { chatId } = router.query;

  const handlePayment = async () => {
    // 🔥 FAKE PAYMENT SUCCESS (you can replace later)
    await updateDoc(doc(db, "chats", chatId), {
      unlocked: true
    });

    alert("Payment Successful 🎉");

    router.push(`/chat/${chatId}`);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1>🔓 Unlock Chat</h1>
        <p>Pay ₹10 to start chatting</p>

        <button style={s.payBtn} onClick={handlePayment}>
          Pay Now
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white"
  },

  card: {
    padding: 30,
    borderRadius: 15,
    background: "rgba(30,27,75,0.6)",
    textAlign: "center"
  },

  payBtn: {
    marginTop: 20,
    padding: 12,
    background: "#22c55e",
    border: "none",
    color: "white",
    borderRadius: 10
  }
};
