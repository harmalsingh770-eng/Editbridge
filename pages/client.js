import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import HomeButton from "../components/HomeButton";

export default function Client() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      setUser(u);

      // ✅ Fetch editors
      const snap = await getDocs(collection(db, "editors"));

      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((e) => e.approved);

      setEditors(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (loading) {
    return <div style={{ padding: 40, color: "white" }}>Loading...</div>;
  }

  return (
    <div style={s.page}>
      <HomeButton />

      <h1>Client Dashboard</h1>

      <button onClick={logout}>Logout</button>

      {/* ✅ EDITORS LIST */}
      <div style={{ marginTop: 30 }}>
        {editors.length === 0 ? (
          <p>No editors found</p>
        ) : (
          editors.map((e) => (
            <div key={e.id} style={s.card}>
              <h3>{e.name}</h3>
              <p>{e.skills?.join(", ")}</p>
              <p>₹{e.price}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: 40,
  },
  card: {
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    background: "#1e293b",
  },
};