import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs
} from "firebase/firestore";

export default function Editor() {
  const router = useRouter();

  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/editor-login");

      // 🔥 find editor by email instead of doc ID
      const snap = await getDocs(collection(db, "editors"));

      const found = snap.docs.find(
        d => d.data().email === u.email
      );

      if (!found) {
        router.replace("/editor-login");
        return;
      }

      setEditor({ id: found.id, ...found.data() });
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div style={s.center}>Loading...</div>;

  return (
    <div style={s.page}>
      <h1>🎬 Editor Dashboard</h1>

      <div style={s.card}>
        <h2>{editor.name}</h2>
        <p>{editor.email}</p>
        <p>{editor.skills?.join(", ")}</p>
        <p>₹{editor.price}</p>
      </div>

      <button
        style={s.btn}
        onClick={() => router.push("/editor/inbox")}
      >
        Inbox
      </button>

      <button style={s.logout} onClick={logout}>
        Logout
      </button>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "#020617",
    color: "white",
  },
  card: {
    padding: 20,
    background: "#111827",
    marginTop: 20,
    borderRadius: 12,
  },
  btn: {
    marginTop: 20,
    padding: 12,
    background: "#7c3aed",
    border: "none",
    color: "white",
  },
  logout: {
    marginTop: 10,
    padding: 12,
    background: "#ef4444",
    border: "none",
    color: "white",
  },
  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};