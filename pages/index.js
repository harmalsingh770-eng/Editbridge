import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));

          if (snap.exists()) {
            const role = snap.data().role;

            // 🔥 AUTO REDIRECT BASED ON ROLE
            if (role === "editor") {
              router.replace("/editor");
              return;
            } else {
              router.replace("/client");
              return;
            }
          }
        } catch (err) {
          console.log(err);
        }
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔄 LOADING SCREEN
  if (loading) {
    return (
      <div style={s.loader}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  // 🎯 DASHBOARD BUTTON LOGIC
  const goDashboard = async () => {
    if (!user) return router.push("/login");

    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.data()?.role;

    router.push(role === "editor" ? "/editor" : "/client");
  };

  return (
    <div style={s.page}>
      {/* NAV */}
      <div style={s.nav}>
        <div style={s.logo}>🎬 EditBridge</div>

        {!user ? (
          <div style={s.navBtns}>
            <button
              onClick={() => router.push("/login?type=client")}
              style={s.btn}
            >
              Client
            </button>

            <button
              onClick={() => router.push("/login?type=editor")}
              style={s.btnPrimary}
            >
              Editor
            </button>

            <button
              onClick={() => router.push("/admin-login")}
              style={s.adminBtn}
            >
              Admin
            </button>
          </div>
        ) : (
          <button onClick={goDashboard} style={s.btnPrimary}>
            Dashboard
          </button>
        )}
      </div>

      {/* HERO */}
      <div style={s.hero}>
        <h1 style={s.title}>
          Work with <span style={s.gradient}>Top Editors</span>
        </h1>

        <p style={s.subtitle}>
          Chat instantly, hire fast, and scale your content production.
        </p>

        <button onClick={goDashboard} style={s.cta}>
          🚀 Get Started
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617"
  },

  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: 20
  },

  logo: {
    fontWeight: 800,
    fontSize: 18
  },

  navBtns: {
    display: "flex",
    gap: 10
  },

  btn: {
    background: "transparent",
    border: "1px solid #444",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8
  },

  btnPrimary: {
    background: "#7c3aed",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8,
    fontWeight: 600
  },

  adminBtn: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8
  },

  hero: {
    textAlign: "center",
    marginTop: 120,
    padding: "0 20px"
  },

  title: {
    fontSize: 40,
    fontWeight: 800
  },

  gradient: {
    background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },

  subtitle: {
    marginTop: 12,
    color: "#94a3b8"
  },

  cta: {
    marginTop: 20,
    padding: 14,
    background: "#6366f1",
    border: "none",
    color: "white",
    borderRadius: 10,
    fontWeight: 600
  }
};