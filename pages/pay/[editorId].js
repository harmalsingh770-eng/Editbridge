import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function Payment() {
  const router = useRouter();
  const { editorId } = router.query;

  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const user = auth.currentUser;
    if (!txnId) return alert("Enter transaction ID");
    if (!user) return alert("Login required");

    setLoading(true);

    const chatId = [user.uid, editorId].sort().join("_");

    await addDoc(collection(db, "paymentRequests"), {
      uid: user.uid,
      email: user.email,
      editorId,
      chatId,
      txnId,
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Payment sent for approval");
    router.push("/client");
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2>🔒 Unlock Chat</h2>

        <a href="upi://pay?pa=yourupi@upi&pn=EditBridge&am=10&cu=INR" style={s.pay}>
          Pay ₹10 via UPI
        </a>

        <input
          placeholder="Transaction ID"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          style={s.input}
        />

        <button onClick={submit} style={s.btn}>
          {loading ? "Submitting..." : "Submit"}
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
    background: "#020617"
  },
  card: {
    background: "#1e293b",
    padding: 25,
    borderRadius: 16,
    width: 300
  },
  pay: {
    display: "block",
    background: "#22c55e",
    padding: 10,
    textAlign: "center",
    borderRadius: 10,
    marginBottom: 10,
    color: "white"
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8
  },
  btn: {
    width: "100%",
    padding: 10,
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 10
  }
};