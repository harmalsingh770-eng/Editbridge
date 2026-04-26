import { useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Please fill all fields");
    setLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account Created ✅");
        router.push("/client"); // ✅ after signup → client page
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        if (email === "admin@editbridge.com") {
          router.push("/admin"); // ✅ admin → admin page
        } else {
          router.push("/client"); // ✅ client → client page
        }
      }
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div style={s.page}>

        {/* Card */}
        <div style={s.card}>

          {/* Logo */}
          <div style={s.logoWrap}>
            <div style={s.logoIcon}>🎬</div>
            <div style={s.logoText}>EditBridge</div>
          </div>

          <h2 style={s.title}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={s.subtitle}>
            {mode === "login"
              ? "Sign in to your account"
              : "Join EditBridge today"}
          </p>

          {/* Tabs */}
          <div style={s.tabs}>
            <button
              style={{
                ...s.tab,
                background: mode === "login" ? "rgba(124,58,237,0.15)" : "transparent",
                color: mode === "login" ? "#a78bfa" : "#475569",
                borderColor: mode === "login" ? "rgba(124,58,237,0.3)" : "transparent",
              }}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              style={{
                ...s.tab,
                background: mode === "signup" ? "rgba(124,58,237,0.15)" : "transparent",
                color: mode === "signup" ? "#a78bfa" : "#475569",
                borderColor: mode === "signup" ? "rgba(124,58,237,0.3)" : "transparent",
              }}
              onClick={() => setMode("signup")}
              type="button"
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handle} style={s.form}>
            <div style={s.fieldWrap}>
              <label style={s.label}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={s.input}
                className="auth-input"
                autoComplete="email"
              />
            </div>

            <div style={s.fieldWrap}>
              <label style={s.label}>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={s.input}
                className="auth-input"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...s.submitBtn,
                opacity: loading ? 0.7 : 1,
              }}
              className="submit-btn"
            >
              {loading ? (
                <span style={s.spinnerRow}>
                  <span style={s.miniSpinner} />
                  Please wait...
                </span>
              ) : mode === "login" ? "Login →" : "Create Account →"}
            </button>
          </form>

          <p style={s.switchText}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span
              style={s.switchLink}
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Sign Up" : "Login"}
            </span>
          </p>

        </div>
      </div>
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  body { font-family: 'Segoe UI', system-ui, sans-serif; }

  .auth-input:focus {
    outline: none;
    border-color: #7c3aed !important;
    background: rgba(124,58,237,0.07) !important;
  }
  .auth-input::placeholder { color: #334155; }

  .submit-btn:hover:not(:disabled) {
    background: #6d28d9 !important;
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(124,58,237,0.45) !important;
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }

  button { cursor: pointer; transition: all 0.18s ease; }
`;

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(160deg,#080d1a 0%,#0f172a 50%,#160a2a 100%)",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: 400,
    background: "rgba(15,23,42,0.95)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 22,
    padding: "32px 28px",
    animation: "fadeUp 0.3s ease",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
    justifyContent: "center",
  },

  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },

  logoText: {
    fontWeight: 800,
    fontSize: 20,
    color: "white",
    letterSpacing: "-0.4px",
  },

  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "white",
    textAlign: "center",
    letterSpacing: "-0.4px",
  },

  subtitle: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 22,
  },

  tabs: {
    display: "flex",
    gap: 6,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 22,
  },

  tab: {
    flex: 1,
    padding: "9px",
    border: "1px solid transparent",
    borderRadius: 9,
    fontWeight: 600,
    fontSize: 13,
    transition: "all 0.18s ease",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    letterSpacing: "0.3px",
  },

  input: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    fontSize: 14,
    transition: "border-color 0.2s, background 0.2s",
  },

  submitBtn: {
    marginTop: 4,
    padding: "13px",
    borderRadius: 13,
    border: "none",
    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: "-0.2px",
    boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
    transition: "all 0.2s ease",
  },

  spinnerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  miniSpinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
    display: "inline-block",
  },

  switchText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 13,
    color: "#475569",
  },

  switchLink: {
    color: "#a78bfa",
    fontWeight: 600,
    cursor: "pointer",
  },
};