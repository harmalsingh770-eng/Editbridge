"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Editor() {
  const router = useRouter();

  const [data, setData]           = useState({ name: "", skills: "", price: "", portfolioLink: "", bio: "", active: false });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [user, setUser]           = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login?type=editor");
      setUser(u);
      const snap = await getDoc(doc(db, "editors", u.uid));
      if (snap.exists()) {
        const d = snap.data();
        setData({
          name: d.name || "",
          skills: (d.skills || []).join(", "),
          price: d.price || "",
          portfolioLink: d.portfolioLink || "",
          bio: d.bio || "",
          active: d.active || false,
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await setDoc(doc(db, "editors", user.uid), {
      name: data.name,
      skills: data.skills.split(",").map(s => s.trim()).filter(Boolean),
      price: Number(data.price) || 0,
      portfolioLink: data.portfolioLink,
      bio: data.bio,
      active: data.active,
      email: user.email,
      updatedAt: new Date(),
    }, { merge: true });
    setSaving(false);
    alert("Saved!");
  };

  const toggleActive = async () => {
    if (!user) return;
    const val = !data.active;
    setData({ ...data, active: val });
    await updateDoc(doc(db, "editors", user.uid), { active: val });
  };

  const confirmLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return (
    <div style={s.loaderPage}>
      <style>{css}</style>
      <div style={s.spinner}></div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 8px" }}>Logout?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px" }}>
              Do you really want to logout?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogout(false)} style={s.mStay}>Stay</button>
              <button onClick={confirmLogout} style={s.mLeave}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <span style={s.logo}>Editor Dashboard</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/editor/inbox")} style={s.btnBlue}>Inbox</button>
          <button onClick={() => setShowLogout(true)} style={s.btnRed}>Logout</button>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div style={s.profileCard}>
        <div style={s.avatar}>{data.name?.[0]?.toUpperCase() || "E"}</div>
        <div>
          <div style={s.profileName}>{data.name || "Your Name"}</div>
          <div style={s.profileEmail}>{user?.email}</div>
        </div>
        <button
          onClick={toggleActive}
          style={{ ...s.statusBtn, background: data.active ? "#10b981" : "#ef4444" }}
        >
          {data.active ? "Online" : "Offline"}
        </button>
      </div>

      {/* FORM */}
      <div style={s.formCard}>
        <div style={s.sectionTitle}>Profile Settings</div>

        <Field label="Display Name">
          <input value={data.name} placeholder="Your Name" onChange={e => setData({ ...data, name: e.target.value })} style={s.input} />
        </Field>

        <Field label="Bio">
          <textarea value={data.bio} placeholder="Tell clients about yourself..." onChange={e => setData({ ...data, bio: e.target.value })} style={{ ...s.input, minHeight: 80, resize: "vertical" }} />
        </Field>

        <Field label="Skills (comma separated)">
          <input value={data.skills} placeholder="e.g. Reels, YouTube, Color Grading" onChange={e => setData({ ...data, skills: e.target.value })} style={s.input} />
        </Field>

        <Field label="Price (Rs.)">
          <input type="number" value={data.price} placeholder="e.g. 500" onChange={e => setData({ ...data, price: e.target.value })} style={s.input} />
        </Field>

        <Field label="Portfolio Link">
          <input value={data.portfolioLink} placeholder="YouTube / Drive link" onChange={e => setData({ ...data, portfolioLink: e.target.value })} style={s.input} />
        </Field>

        <button onClick={save} style={s.saveBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const css = `
  body { margin: 0; font-family: sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)", color: "white", paddingBottom: 40 },
  loaderPage: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#020617" },
  spinner: { width: 34, height: 34, border: "3px solid #333", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#1e293b", borderRadius: 16, padding: 24, width: 280, textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" },
  mStay: { flex: 1, padding: "10px 16px", background: "#334155", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },
  mLeave: { flex: 1, padding: "10px 16px", background: "#ef4444", border: "none", color: "white", borderRadius: 10, cursor: "pointer", fontWeight: 600 },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  logo: { fontWeight: 800, fontSize: 17 },
  btnBlue: { background: "#6366f1", border: "none", color: "white", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnRed: { background: "#ef4444", border: "none", color: "white", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },

  profileCard: { margin: 16, background: "#1e293b", borderRadius: 16, padding: 18, display: "flex", alignItems: "center", gap: 14, border: "1px solid rgba(255,255,255,0.06)" },
  avatar: { width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 },
  profileName: { fontWeight: 700, fontSize: 16 },
  profileEmail: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  statusBtn: { marginLeft: "auto", padding: "7px 14px", border: "none", borderRadius: 20, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 },

  formCard: { margin: "0 16px", background: "#1e293b", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,0.06)" },
  sectionTitle: { fontWeight: 700, fontSize: 15, marginBottom: 18 },
  input: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" },
  saveBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg,#7c3aed,#6366f1)", border: "none", color: "white", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 },
};