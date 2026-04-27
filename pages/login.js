import { useRouter } from "next/router";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const router = useRouter();
  const { type } = router.query;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const role = type === "editor" ? "editor" : "client";

  // ✅ FIX: Wrapped in try/catch with loading state + error display
  const login = async () => {
    if (!email || !password) return setError("Fill in all fields");
    setError("");
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      const userSnap = await getDoc(doc(db, "users", uid));

      if (!userSnap.exists()) {
        setError("User data missing. Please sign up.");
        setLoading(false);
        return;
      }

      const userRole = userSnap.data().role;

      if (userRole === "editor") {
        router.push("/editor");
      } else if (userRole === "admin") {
        router.push("/admin");
      } else {
        router.push("/client");
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  // ✅ FIX: Added createdAt timestamp + try/catch
  const signup = async () => {
    if (!email || !password) return setError("Fill in all fields");
    setError("");
    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // 🔥 USERS COLLECTION
      await setDoc(doc(db, "users", uid), {
        email,
        role,
        createdAt: serverTimestamp(),
      });

      // 🔥 IF EDITOR → CREATE EDITOR PROFILE
      if (role === "editor") {
        await setDoc(doc(db, "editors", uid), {
          email,
          name: "New Editor",
          skills: [],
          price: 0,
          approved: false,
          active: false,
        });

        router.push("/editor"); // ✅ FIX: Go to editor page which shows pending screen
        return;
      }

      router.push("/client");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>{role === "editor" ? "🎬" : "👤"}</div>
        <h1 style={s.title}>{role.toUpperCase()} LOGIN</h1>

        {error && <div style={s.error}>{error}</div>}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={s.input}
          type="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={s.input}
        />

        <button onClick={login} style={s.btnPrimary} disabled={loading}>
          {loading ? "..." : "Login"}
        </button>
        <button onClick={signup} style={s.btnSecondary} disabled={loading}>
          {loading ? "..." : "Sign Up"}
        </button>

        <button onClick={() => router.push("/")} style={s.backLink}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
  },
  card: {
    background: "#1e293b",
    padding: 36,
    borderRadius: 16,
    width: "90%",
    maxWidth: 360,
    color: "white",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  icon: { fontSize: 36, textAlign: "center" },
  title: { textAlign: "center", fontWeight: 800, fontSize: 20, margin: 0 },
  error: {
    background: "#7f1d1d",
    color: "#fca5a5",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "white",
    outline: "none",
    fontSize: 14,
  },
  btnPrimary: {
    padding: 12,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  btnSecondary: {
    padding: 12,
    background: "#334155",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  backLink: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    textAlign: "center",
    fontSize: 13,
  },
};