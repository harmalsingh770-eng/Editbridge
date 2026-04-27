import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div style={s.loaderPage}>
        <div style={s.loader}></div>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div style={s.page}>
        {/* BACKGROUND */}
        <div style={s.noise}></div>
        <div style={s.orb1}></div>
        <div style={s.orb2}></div>

        {/* NAV */}
        <div style={s.nav}>
          <div style={s.logo}>🎬 EditBridge</div>

          <div style={s.navBtns}>
            {!user ? (
              <>
                <button onClick={() => router.push("/login")} style={s.loginBtn}>
                  Login
                </button>
                <button onClick={() => router.push("/login")} style={s.ctaBtn}>
                  Get Started
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/client")} style={s.ctaBtn}>
                  Go to Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        {/* HERO */}
        <div style={s.hero}>
          <h1 className="fadeUp" style={s.title}>
            Work with <span style={s.gradient}>Top Editors</span>
          </h1>

          <p className="fadeUp delay1" style={s.subtitle}>
            Hire elite video editors, chat instantly, and scale your content.
          </p>

          <div className="fadeUp delay2" style={s.heroBtns}>
            <button
              onClick={() =>
                router.push(user ? "/client" : "/login")
              }
              style={s.mainBtn}
            >
              🚀 {user ? "Open Dashboard" : "Get Started"}
            </button>

            <button style={s.secondaryBtn}>▶ Demo</button>
          </div>
        </div>

        {/* FEATURES */}
        <div style={s.features}>
          <Feature icon="⚡" title="Instant Chat" desc="Real-time messaging system" />
          <Feature icon="💎" title="Top Talent" desc="Verified editors" />
          <Feature icon="🔒" title="Secure Access" desc="One-time unlock model" />
        </div>

        {/* FOOTER */}
        <div style={s.footer}>
          © {new Date().getFullYear()} EditBridge
        </div>
      </div>
    </>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="card">
      <div style={{ fontSize: 26 }}>{icon}</div>
      <h3>{title}</h3>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>{desc}</p>
    </div>
  );
}

const css = `
  body { margin: 0; font-family: 'Segoe UI', sans-serif; }

  @keyframes spin { to { transform: rotate(360deg); } }

  .fadeUp {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeUp 0.7s ease forwards;
  }

  .delay1 { animation-delay: 0.2s; }
  .delay2 { animation-delay: 0.4s; }

  @keyframes fadeUp {
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  }

  .card {
    width: 220px;
    padding: 20px;
    border-radius: 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    text-align: center;
    transition: 0.3s;
  }

  .card:hover {
    transform: translateY(-6px) scale(1.03);
    box-shadow: 0 20px 40px rgba(124,58,237,0.25);
  }
`;

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
    position: "relative",
    overflow: "hidden",
  },

  loaderPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
  },

  loader: {
    width: 40,
    height: 40,
    border: "3px solid #222",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  noise: {
    position: "absolute",
    inset: 0,
    opacity: 0.05,
    backgroundImage:
      "url('https://grainy-gradients.vercel.app/noise.svg')",
  },

  orb1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle,#7c3aed55,transparent 70%)",
    top: -80,
    left: -80,
    animation: "float 6s ease-in-out infinite",
  },

  orb2: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle,#3b82f655,transparent 70%)",
    bottom: -100,
    right: -100,
    animation: "float 8s ease-in-out infinite",
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 40px",
  },

  logo: { fontWeight: 800, fontSize: 18 },

  navBtns: { display: "flex", gap: 10 },

  loginBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    padding: "8px 16px",
    borderRadius: 10,
  },

  ctaBtn: {
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
    border: "none",
    color: "white",
    padding: "8px 16px",
    borderRadius: 10,
  },

  hero: {
    textAlign: "center",
    paddingTop: 100,
    maxWidth: 700,
    margin: "auto",
  },

  title: {
    fontSize: 44,
    fontWeight: 800,
  },

  gradient: {
    background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  subtitle: {
    marginTop: 16,
    color: "#94a3b8",
    fontSize: 15,
  },

  heroBtns: {
    marginTop: 24,
    display: "flex",
    justifyContent: "center",
    gap: 12,
  },

  mainBtn: {
    padding: "12px 22px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
    color: "white",
    fontWeight: 700,
  },

  secondaryBtn: {
    padding: "12px 22px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "white",
  },

  features: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    padding: "60px 20px",
    flexWrap: "wrap",
  },

  footer: {
    textAlign: "center",
    padding: 30,
    fontSize: 12,
    color: "#64748b",
  },
};