import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      try {
        // ✅ CHECK PAYMENT ACCESS
        const accessSnap = await getDoc(doc(db, "clientAccess", u.uid));
        if (accessSnap.exists() && accessSnap.data().status === "approved") {
          setApproved(true);
        }

        // ✅ LOAD EDITORS
        const snap = await getDocs(collection(db, "editors"));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEditors(list);

      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAction = (editorId) => {
    const user = auth.currentUser;
    if (!user) return;

    if (!approved) {
      router.push(`/pay/editor?editorId=${editorId}`);
    } else {
      const ids = [user.uid, editorId].sort();
      const chatId = ids.join("_");
      router.push(`/chat/${chatId}`);
    }
  };

  if (loading) {
    return <div style={s.loader}></div>;
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>🔥 Find an Editor</h1>
        <button onClick={() => auth.signOut()} style={s.logout}>
          Logout
        </button>
      </div>

      {editors.map((e) => (
        <div key={e.id} style={s.card}>
          <div>
            <h2 style={s.name}>{e.name}</h2>
            <p style={s.skills}>{e.skills?.join(", ")}</p>
            <p style={s.price}>₹{e.price}</p>
          </div>

          <button
            onClick={() => handleAction(e.id)}
            style={approved ? s.chatBtn : s.lockBtn}
          >
            {approved ? "💬 Chat Now" : "🔒 Pay ₹10"}
          </button>
        </div>
      ))}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  loader: {
    height: "100vh",
    background: "#020617"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  title: { fontSize: 24, fontWeight: 800 },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    color: "white"
  },

  card: {
    background: "rgba(30,41,59,0.6)",
    backdropFilter: "blur(20px)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  name: { fontSize: 18, fontWeight: 700 },
  skills: { color: "#94a3b8", fontSize: 13 },
  price: { color: "#a78bfa", fontWeight: 600 },

  chatBtn: {
    background: "#6366f1",
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600
  },

  lockBtn: {
    background: "#7c3aed",
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600
  }
};