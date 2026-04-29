import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const features = [
    { icon: "💸", title: "Pocket-Friendly", desc: "Start earning with zero investment. Perfect for students on a budget." },
    { icon: "🎓", title: "Student First", desc: "Designed for college students who want real income between classes." },
    { icon: "⚡", title: "Fast Payouts", desc: "Complete edits, get paid quickly. No waiting weeks for your money." },
    { icon: "🔒", title: "Safe & Secure", desc: "Every transaction is verified. Your earnings are always protected." },
  ];

  const stats = [
    { value: "500+", label: "Student Editors" },
    { value: "₹10", label: "Starting Rate" },
    { value: "24hr", label: "Fast Turnaround" },
    { value: "100%", label: "Secure Payments" },
  ];

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* Animated background orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.orb3} />

      {/* Grid overlay */}
      <div style={s.grid} />

      {/* NAV */}
      <nav style={{ ...s.nav, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-20px)" }}>
        <div style={s.navLogo}>
          <span style={s.logoHeart}>💜</span>
          <span style={s.logoText}>EditBridge</span>
        </div>
        <div style={s.navTag}>By Gurnek</div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={{ ...s.heroInner, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)" }}>

          <div style={s.badge}>
            <span style={s.badgeDot} />
            🎓 Built for Students · Made in India
          </div>

          <h1 style={s.heroTitle}>
            <span style={s.heroLine1}>Your Skills.</span>
            <br />
            <span style={s.heroLine2}>Your Income.</span>
            <br />
            <span style={s.heroLine3}>Your Time.</span>
          </h1>

          <p style={s.heroSub}>
            EditBridge connects <strong style={{ color: "#c4b5fd" }}>student editors</strong> with clients
            who need quality work — at prices that won't break the bank.
            <br />
            Earn <strong style={{ color: "#34d399" }}>pocket money</strong> doing what you already love.
          </p>

          {/* MISSION STATEMENT */}
          <div style={s.missionBox}>
            <div style={s.missionIcon}>🌟</div>
            <p style={s.missionText}>
              Our aim is to provide students with a <em style={{ color: "#fbbf24", fontStyle: "normal", fontWeight: 700 }}>pocket-friendly income</em> —
              empowering the next generation to earn independently without sacrificing their studies.
            </p>
          </div>

          {/* STATS */}
          <div style={s.statsRow}>
            {stats.map((st, i) => (
              <div key={i} style={{ ...s.statItem, animationDelay: `${0.1 * i}s` }} className="stat-pop">
                <div style={s.statValue}>{st.value}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* BUTTONS */}
          <div style={s.btnGroup}>
            <button
              className="btn-hover"
              onClick={() => router.push("/login?type=client")}
              style={s.btnClient}
            >
              <span>👤</span> I Need Editing
            </button>
            <button
              className="btn-hover"
              onClick={() => router.push("/login?type=editor")}
              style={s.btnEditor}
            >
              <span>✏️</span> I'm an Editor
            </button>
          </div>

          <button
            onClick={() => router.push("/admin-login")}
            style={s.btnAdmin}
          >
            🔐 Admin Access
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section style={s.features}>
        <h2 style={s.featuresTitle}>Why Students Choose EditBridge</h2>
        <div style={s.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} style={s.featureCard} className="card-hover">
              <div style={s.featureIcon}>{f.icon}</div>
              <div style={s.featureName}>{f.title}</div>
              <div style={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.howSection}>
        <h2 style={s.featuresTitle}>How It Works</h2>
        <div style={s.steps}>
          {[
            { n: "01", t: "Client Posts", d: "Client requests editing work and pays a small fee to unlock chat." },
            { n: "02", t: "Editor Connects", d: "A student editor gets notified and opens the conversation." },
            { n: "03", t: "Work & Earn", d: "Edit is completed, client is happy, editor gets paid. Simple." },
          ].map((step, i) => (
            <div key={i}>
              <div style={s.step}>
                <div style={s.stepNum}>{step.n}</div>
                <div style={s.stepTitle}>{step.t}</div>
                <div style={s.stepDesc}>{step.d}</div>
              </div>
              {i < 2 && <div style={s.stepArrow}>↓</div>}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerLogo}>💜 EditBridge</div>
        <p style={s.footerTagline}>Empowering students. One edit at a time.</p>
        <p style={s.footerCredit}>
          Crafted with 💜 by <strong style={{ color: "#c4b5fd" }}>Gurnek</strong>
        </p>
      </footer>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

  @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-40px) scale(1.1);} }
  @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-20px,30px) scale(0.95);} }
  @keyframes float3 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(15px,-20px);} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(30px);} to{opacity:1;transform:translateY(0);} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.8);} }

  .btn-hover { transition: all 0.2s ease !important; }
  .btn-hover:hover { transform: translateY(-3px) scale(1.03) !important; box-shadow: 0 12px 35px rgba(124,58,237,0.5) !important; }

  .card-hover { transition: all 0.25s ease !important; }
  .card-hover:hover { transform: translateY(-5px) !important; border-color: rgba(167,139,250,0.4) !important; }

  .stat-pop { animation: fadeUp 0.5s ease both; }
`;

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(160deg,#020617 0%,#0f172a 40%,#1e1b4b 75%,#0f172a 100%)", color: "white", position: "relative", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" },

  orb1: { position: "fixed", top: "-15%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)", animation: "float1 8s ease-in-out infinite", pointerEvents: "none", zIndex: 0 },
  orb2: { position: "fixed", bottom: "0%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)", animation: "float2 10s ease-in-out infinite", pointerEvents: "none", zIndex: 0 },
  orb3: { position: "fixed", top: "40%", left: "50%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(52,211,153,0.1) 0%,transparent 70%)", animation: "float3 6s ease-in-out infinite", pointerEvents: "none", zIndex: 0 },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 },

  nav: { position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", transition: "all 0.6s ease" },
  navLogo: { display: "flex", alignItems: "center", gap: 8 },
  logoHeart: { fontSize: 24 },
  logoText: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" },
  navTag: { fontSize: 12, color: "#94a3b8", background: "rgba(255,255,255,0.06)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" },

  hero: { position: "relative", zIndex: 5, padding: "20px 24px 40px" },
  heroInner: { maxWidth: 480, margin: "0 auto", textAlign: "center", transition: "all 0.8s ease" },

  badge: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)", padding: "6px 16px", borderRadius: 30, fontSize: 12, color: "#c4b5fd", marginBottom: 28, fontWeight: 500 },
  badgeDot: { width: 7, height: 7, borderRadius: "50%", background: "#34d399", animation: "pulse 2s ease infinite", display: "inline-block" },

  heroTitle: { fontFamily: "'Syne',sans-serif", margin: "0 0 20px", lineHeight: 1.1, letterSpacing: "-1.5px" },
  heroLine1: { fontSize: 46, fontWeight: 800, color: "white", display: "block" },
  heroLine2: { fontSize: 46, fontWeight: 800, background: "linear-gradient(135deg,#c4b5fd,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "block" },
  heroLine3: { fontSize: 46, fontWeight: 800, background: "linear-gradient(135deg,#34d399,#6ee7b7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "block" },

  heroSub: { fontSize: 15, color: "#94a3b8", lineHeight: 1.7, margin: "0 0 28px", fontWeight: 300 },

  missionBox: { background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(52,211,153,0.08))", border: "1px solid rgba(196,181,253,0.2)", borderRadius: 16, padding: "18px 20px", marginBottom: 28, display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left" },
  missionIcon: { fontSize: 22, flexShrink: 0, marginTop: 2 },
  missionText: { fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, margin: 0, fontWeight: 300 },

  statsRow: { display: "flex", gap: 8, marginBottom: 30, justifyContent: "center", flexWrap: "wrap" },
  statItem: { flex: 1, minWidth: 70, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 8px", textAlign: "center" },
  statValue: { fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#c4b5fd" },
  statLabel: { fontSize: 10, color: "#64748b", marginTop: 3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" },

  btnGroup: { display: "flex", gap: 12, marginBottom: 12 },
  btnClient: { flex: 1, padding: "14px 10px", background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", color: "white", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'DM Sans',sans-serif" },
  btnEditor: { flex: 1, padding: "14px 10px", background: "transparent", border: "2px solid rgba(124,58,237,0.6)", color: "white", borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'DM Sans',sans-serif" },
  btnAdmin: { width: "100%", padding: 11, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" },

  features: { position: "relative", zIndex: 5, padding: "10px 24px 40px" },
  featuresTitle: { fontFamily: "'Syne',sans-serif", textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 20, color: "white", letterSpacing: "-0.5px" },
  featuresGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 480, margin: "0 auto" },
  featureCard: { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 16px", cursor: "default" },
  featureIcon: { fontSize: 26, marginBottom: 10 },
  featureName: { fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 6, color: "white" },
  featureDesc: { fontSize: 12, color: "#64748b", lineHeight: 1.6 },

  howSection: { position: "relative", zIndex: 5, padding: "0 24px 50px" },
  steps: { maxWidth: 480, margin: "0 auto" },
  step: { background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "18px 20px" },
  stepNum: { fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 800, color: "#7c3aed", letterSpacing: "0.1em", marginBottom: 6 },
  stepTitle: { fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 },
  stepDesc: { fontSize: 13, color: "#64748b", lineHeight: 1.6 },
  stepArrow: { textAlign: "center", fontSize: 20, color: "#334155", padding: "8px 0" },

  footer: { position: "relative", zIndex: 5, textAlign: "center", padding: "30px 24px 40px", borderTop: "1px solid rgba(255,255,255,0.06)" },
  footerLogo: { fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 },
  footerTagline: { color: "#475569", fontSize: 13, margin: "0 0 12px" },
  footerCredit: { color: "#334155", fontSize: 12, margin: 0 },
};