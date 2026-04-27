import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Editor() {
  const router = useRouter();
  const [editor, setEditor] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | pending | ready | error

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login?type=editor");
        return;
      }

      try {
        // 🔥 CHECK ROLE FIRST
        const userSnap = await getDoc(doc(db, "users", u.uid));

        if (!userSnap.exists() || userSnap.data().role !== "editor") {
          router.replace("/client");
          return;
        }

        // 🔥 GET EDITOR DATA
        const editorSnap = await getDoc(doc(db, "editors", u.uid));

        if (!editorSnap.exists()) {
          router.replace("/login?type=editor");
          return;
        }

        // ✅ FIX: Instead of alert + hang, show a proper pending screen
        if (!editorSnap.data().approved) {
          setStatus("pending");
          return;
        }

        setEditor(editorSnap.data());
        setStatus("ready");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    });

    return () => unsub();
  }, []);

  // ⏳ PENDING APPROVAL SCREEN (was causing the stuck bug)
  if (status === "pending") {
    return (
      <div style={s.centerPage}>
        <div style={s.card}>
          <div style={s.icon}>⏳</div>
          <h2 style={s.title}>Awaiting Approval</h2>
          <p style={s.sub}>
            Your editor account is under review. The admin will approve it
            shortly.
          </p>
          <button
            style={s.backBtn}
            onClick={() => {
              auth.signOut();
              router.replace("/");
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={s.centerPage}>
        <div style={s.card}>
          <div style={s.icon}>❌</div>
          <h2 style={s.title}>Something went wrong</h2>
          <button style={s.backBtn} onClick={() => router.replace("/")}>
            ← Go Home
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading" || !editor) {
    return (
      <div style={s.centerPage}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.heading}>🎬 Editor Dashboard</h1>
        <button
          style={s.logoutBtn}
          onClick={() => {
            auth.signOut();
            router.replace("/");
          }}
        >
          Logout
        </button>
      </div>

      <div style={s.infoCard}>
        <h2 style={s.name}>{editor.name}</h2>
        <p style={s.detail}>{editor.email}</p>
        <p style={s.detail}>Skills: {editor.skills?.join(", ") || "—"}</p>
        <p style={s.detail}>Price: ₹{editor.price}</p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
    padding: 20,
  },
  centerPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },
  card: {
    background: "#1e293b",
    padding: 40,
    borderRadius: 16,
    textAlign: "center",
    maxWidth: 380,
    width: "90%",
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 8 },
  sub: { color: "#94a3b8", fontSize: 14, marginBottom: 24 },
  backBtn: {
    padding: "10px 20px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  heading: { fontSize: 24, fontWeight: 800 },
  logoutBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
  },
  infoCard: {
    background: "#1e293b",
    padding: 24,
    borderRadius: 12,
  },
  name: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  detail: { color: "#94a3b8", marginBottom: 6 },
};