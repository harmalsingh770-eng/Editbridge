import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Editor() {
  const router = useRouter();

  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login?type=editor");
        return;
      }

      try {
        // ✅ FAST + CORRECT
        const snap = await getDoc(doc(db, "editors", u.uid));

        if (!snap.exists()) {
          alert("Editor profile not found");
          router.replace("/login?type=editor");
          return;
        }

        setEditor(snap.data());
        setLoading(false);

      } catch (err) {
        console.log(err);
        router.replace("/");
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.loader}></div>
      </div>
    );
  }

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
        onClick={() => router.push(`/chat/admin_${auth.currentUser.uid}`)}
      >
        💬 Chat Admin
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
  loader: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};