"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  setDoc
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();

  const [tab, setTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      const unsub1 = onSnapshot(collection(db, "paymentRequests"), snap =>
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

      const unsub2 = onSnapshot(collection(db, "editors"), snap =>
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

      const unsub3 = onSnapshot(collection(db, "users"), snap =>
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      );

      setLoading(false);

      return () => {
        unsub1();
        unsub2();
        unsub3();
      };
    });

    return () => unsub();
  }, []);

  // ✅ APPROVE
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved"
    });

    await setDoc(doc(db, "clientAccess", p.chatId), {
      uid: p.uid,
      editorId: p.editorId,
      chatId: p.chatId,
      status: "approved"
    });

    alert("Approved ✅");
  };

  // ❌ REJECT
  const rejectPayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "rejected"
    });

    alert("Rejected ❌");
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div style={s.loader}>Loading...</div>;

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <h2>⚡ Admin Panel</h2>
        <button onClick={logout} style={s.logout}>Logout</button>
      </div>

      {/* TABS */}
      <div style={s.tabs}>
        {["payments", "editors", "users"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tab === t ? s.tabActive : s.tab}
          >
            {t}
          </button>
        ))}
      </div>

      {/* PAYMENTS */}
      {tab === "payments" && payments.map(p => (
        <div key={p.id} style={s.card}>
          <div>
            <b>{p.email}</b><br />
            Txn: {p.txnId}<br />
            Status: {p.status || "pending"}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={s.green} onClick={() => approvePayment(p)}>
              Approve
            </button>

            <button style={s.red} onClick={() => rejectPayment(p)}>
              Reject
            </button>
          </div>
        </div>
      ))}

      {/* EDITORS */}
      {tab === "editors" && editors.map(e => (
        <div key={e.id} style={s.card}>
          <div>
            <b>{e.name}</b><br />
            ₹{e.price}<br />
            {e.portfolio || "No portfolio"}
          </div>
        </div>
      ))}

      {/* USERS */}
      {tab === "users" && users.map(u => (
        <div key={u.id} style={s.card}>
          {u.email}
        </div>
      ))}
    </div>
  );
}

const s = {
  page: {
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    minHeight: "100vh",
    padding: 20,
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  tabs: {
    display: "flex",
    gap: 10,
    margin: "20px 0"
  },

  tab: {
    padding: 10,
    background: "#1e293b",
    borderRadius: 8,
    color: "#94a3b8",
    border: "none"
  },

  tabActive: {
    padding: 10,
    background: "#7c3aed",
    borderRadius: 8,
    border: "none",
    color: "white"
  },

  card: {
    background: "rgba(30,27,75,0.6)",
    backdropFilter: "blur(10px)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  green: {
    background: "#10b981",
    padding: "6px 10px",
    border: "none",
    borderRadius: 6,
    color: "white"
  },

  red: {
    background: "#ef4444",
    padding: "6px 10px",
    border: "none",
    borderRadius: 6,
    color: "white"
  },

  logout: {
    background: "#ef4444",
    padding: 10,
    borderRadius: 8,
    border: "none",
    color: "white"
  },

  loader: {
    color: "white",
    textAlign: "center",
    marginTop: 100
  }
};