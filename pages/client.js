import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc
} from "firebase/firestore";

export default function Client() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [editors, setEditors] = useState([]);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      setUser(u);

      // ✅ check role
      const userSnap = await getDoc(doc(db, "users", u.uid));
      if (userSnap.data()?.role !== "client") {
        router.replace("/");
        return;
      }

      // ✅ get editors
      const snap = await getDocs(collection(db, "editors"));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.approved);

      setEditors(list);

      // ✅ check payment access
      const accessSnap = await getDoc(doc(db, "clientAccess", u.uid));
      if (accessSnap.exists()) setAccess(accessSnap.data());

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  // 🔥 SEND PAYMENT REQUEST
  const sendPayment = async () => {
    const txnId = prompt("Enter UPI Transaction ID");
    if (!txnId) return;

    await setDoc(doc(collection(db, "paymentRequests")), {
      uid: user.uid,
      email: user.email,
      txnId,
      amount: 10,
      status: "pending",
      createdAt: new Date(),
    });

    alert("Payment submitted. Wait for admin approval.");
  };

  if (loading) return <div style={s.center}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1>Client Dashboard</h1>
        <button onClick={logout} style={s.logout}>Logout</button>
      </div>

      {/* 🔒 LOCK SCREEN */}
      {access?.status !== "approved" && (
        <div style={s.lock}>
          <h2>🔒 Chat Locked</h2>
          <p>Pay ₹10 to unlock chat</p>

          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=yourupi@upi&pn=EditBridge&am=10"
            style={{ marginTop: 10 }}
          />

          <button onClick={sendPayment} style={s.payBtn}>
            I HAVE PAID
          </button>

          {access?.status === "pending" && (
            <p style={{ color: "orange" }}>⏳ Waiting for approval</p>
          )}
        </div>
      )}

      {/* ✅ EDITORS LIST */}
      <div style={s.grid}>
        {editors.map(e => (
          <div key={e.id} style={s.card}>
            <h3>{e.name}</h3>
            <p>{e.skills?.join(", ")}</p>
            <p>₹{e.price}</p>

            <button
              disabled={access?.status !== "approved"}
              style={{
                ...s.chatBtn,
                opacity: access?.status !== "approved" ? 0.4 : 1
              }}
              onClick={() => router.push(`/chat/${user.uid}_${e.id}`)}
            >
              💬 Chat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  logout: {
    background: "#ef4444",
    border: "none",
    padding: 10,
    color: "white",
  },
  lock: {
    background: "#111827",
    padding: 20,
    borderRadius: 14,
    textAlign: "center",
    marginTop: 20,
  },
  payBtn: {
    marginTop: 15,
    padding: 12,
    background: "#10b981",
    border: "none",
    color: "white",
    borderRadius: 10,
  },
  grid: {
    display: "grid",
    gap: 12,
    marginTop: 20,
  },
  card: {
    padding: 15,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
  },
  chatBtn: {
    marginTop: 10,
    padding: 10,
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 8,
  },
  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};