import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../../firebase";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

export default function Admin() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [isAdmin, setIsAdmin] = useState(false);
  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);

  // 🔐 Admin login check
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login");
      } else if (user.email === "admin@editbridge.com") {
        setIsAdmin(true);
        loadData();
      } else {
        alert("Not Admin");
        router.push("/");
      }
    });
    return () => unsub();
  }, []);

  // 📥 Load data
  const loadData = async () => {
    const paySnap = await getDocs(collection(db, "payments"));
    const editorSnap = await getDocs(collection(db, "editors"));

    setPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setEditors(editorSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ✅ Approve payment
  const approvePayment = async (id) => {
    await updateDoc(doc(db, "payments", id), {
      status: "approved"
    });
    alert("Payment Approved");
    loadData();
  };

  // ❌ Reject payment
  const rejectPayment = async (id) => {
    await updateDoc(doc(db, "payments", id), {
      status: "rejected"
    });
    alert("Payment Rejected");
    loadData();
  };

  // ✅ Approve editor
  const approveEditor = async (id) => {
    await updateDoc(doc(db, "editors", id), {
      approved: true
    });
    alert("Editor Approved");
    loadData();
  };

  if (!isAdmin) return <p style={{ textAlign: "center" }}>Checking...</p>;

  return (
    <div style={{
      padding: "20px",
      background: "#0f0f0f",
      color: "white",
      minHeight: "100vh"
    }}>
      <h1>Admin Panel</h1>

      {/* 💳 PAYMENTS */}
      <h2>Payment Requests</h2>
      {payments.map(p => (
        <div key={p.id} style={{ border: "1px solid #333", margin: "10px", padding: "10px" }}>
          <p>User: {p.email}</p>
          <p>Txn: {p.txnId}</p>
          <p>Status: {p.status}</p>

          {p.status === "pending" && (
            <>
              <button onClick={() => approvePayment(p.id)}>Approve</button>
              <button onClick={() => rejectPayment(p.id)}>Reject</button>
            </>
          )}
        </div>
      ))}

      {/* 🎬 EDITORS */}
      <h2>Editor Profiles</h2>
      {editors.map(e => (
        <div key={e.id} style={{ border: "1px solid #333", margin: "10px", padding: "10px" }}>
          <p>Name: {e.name}</p>
          <p>Skills: {e.skills?.join(", ")}</p>
          <p>Status: {e.approved ? "Approved" : "Pending"}</p>

          {!e.approved && (
            <button onClick={() => approveEditor(e.id)}>Approve</button>
          )}
        </div>
      ))}
    </div>
  );
}
