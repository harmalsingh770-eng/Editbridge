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
        // ✅ DIRECT FETCH USING UID (CORRECT WAY)
        const ref = doc(db, "editors", u.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.log("❌ Editor doc not found");
          router.replace("/login?type=editor");
          return;
        }

        const data = snap.data();

        // ✅ approval check
        if (!data.approved) {
          alert("⏳ Waiting for admin approval");
          router.replace("/");
          return;
        }

        setEditor(data);
        setLoading(false);

      } catch (err) {
        console.error(err);
        router.replace("/");
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  // 🔄 LOADING SCREEN
  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.loader}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.title}>🎬 Editor Dashboard</h1>
        <button onClick={logout} style={s.logout}>Logout</button>
      </div>

      {/* PROFILE CARD */}
      <div style={s.card}>
        <h2>{editor.name}</h2>
        <p>{editor.email}</p>
        <p>Skills: {editor.skills?.join(", ") || "Not set"}</p>
        <p>Price: ₹{editor.price}</p>
        <p>Status: {editor.active ? "🟢 Online" : "🔴 Offline"}</p>
      </div>

      {/* ACTIONS */}
      <div style={s.grid}>
        <button
          style={btn("#7c3aed")}
          onClick={() => router.push("/editor/inbox")}
        >
          📩 Inbox
        </button>

        <button
          style={btn("#06b6d4")}
          onClick={() => router.push(`/chat/admin_${auth.currentUser.uid}`)}
        >
          💬 Chat Admin
        </button>
      </div>
    </div>
  );
}

// 🎨 UI
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
    alignItems: "center"
  },

  title: {
    fontSize: 22,
    fontWeight: 800
  },

  logout: {
    padding: "8px 14px",
    background: "#ef4444",
    border: "none",
    borderRadius: 8,
    color: "white"
  },

  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)"
  },

  grid: {
    marginTop: 25,
    display: "grid",
    gap: 12
  },

  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  loader: {
    width: 30,
    height: 30,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

function btn(bg) {
  return {
    padding: 14,
    border: "none",
    borderRadius: 12,
    background: bg,
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  };
}