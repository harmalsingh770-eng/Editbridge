"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Editor() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    price: "",
    skills: "",
    portfolio: [],
    active: true
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");

      setUser(u);

      const ref = doc(db, "editors", u.uid);

      const unsubDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) setProfile(snap.data());
        setLoading(false);
      });

      return () => unsubDoc();
    });

    return () => unsub();
  }, []);

  const saveProfile = async () => {
    await setDoc(
      doc(db, "editors", user.uid),
      {
        ...profile,
        skills: typeof profile.skills === "string"
          ? profile.skills.split(",").map(s => s.trim())
          : profile.skills,
        active: profile.active,
        approved: true,
        email: user.email
      },
      { merge: true }
    );

    alert("✅ Saved");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <h2>🎬 Editor Dashboard</h2>

        <div style={{display:"flex",gap:10}}>
          <button style={s.inbox} onClick={()=>router.push("/editor/inbox")}>
            Inbox
          </button>

          {/* 🔥 SETTINGS BUTTON */}
          <button style={s.settings} onClick={()=>setShowSettings(true)}>
            Settings
          </button>

          <button onClick={() => signOut(auth)} style={s.logout}>
            Logout
          </button>
        </div>
      </div>

      {/* PROFILE */}
      <div style={s.card}>
        <h3>Profile</h3>

        <input
          placeholder="Name"
          value={profile.name || ""}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          style={s.input}
        />

        <textarea
          placeholder="Bio"
          value={profile.bio || ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          style={s.input}
        />

        <input
          placeholder="Skills"
          value={profile.skills?.join?.(", ") || profile.skills || ""}
          onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
          style={s.input}
        />

        <input
          placeholder="Price ₹"
          value={profile.price || ""}
          onChange={(e) => setProfile({ ...profile, price: Number(e.target.value) })}
          style={s.input}
        />
      </div>

      <button onClick={saveProfile} style={s.save}>
        Save Profile
      </button>

      {/* 🔥 SETTINGS MODAL */}
      {showSettings && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h3>⚙️ Settings</h3>

            {/* ACTIVE TOGGLE */}
            <div style={{marginTop:10}}>
              <label>Active Status:</label>
              <button
                style={{
                  marginLeft:10,
                  background: profile.active ? "#22c55e" : "#ef4444",
                  padding:"6px 10px",
                  border:"none",
                  borderRadius:6,
                  color:"white"
                }}
                onClick={() =>
                  setProfile({ ...profile, active: !profile.active })
                }
              >
                {profile.active ? "ON" : "OFF"}
              </button>
            </div>

            {/* PORTFOLIO EDIT */}
            <textarea
              placeholder="Portfolio Links (comma separated)"
              value={profile.portfolio?.join?.(", ") || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  portfolio: e.target.value.split(",").map(p => p.trim())
                })
              }
              style={s.input}
            />

            <button onClick={saveProfile} style={s.save}>
              Save Settings
            </button>

            <button
              onClick={()=>setShowSettings(false)}
              style={{...s.logout, marginTop:10}}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{
    minHeight:"100vh",
    padding:20,
    background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color:"white"
  },
  header:{
    display:"flex",
    justifyContent:"space-between",
    marginBottom:20
  },
  inbox:{
    background:"#6366f1",
    border:"none",
    padding:"8px 12px",
    borderRadius:8,
    color:"white"
  },
  settings:{
    background:"#0ea5e9",
    border:"none",
    padding:"8px 12px",
    borderRadius:8,
    color:"white"
  },
  logout:{
    background:"#ef4444",
    border:"none",
    padding:"8px 12px",
    borderRadius:8,
    color:"white"
  },
  card:{
    background:"rgba(30,41,59,0.6)",
    padding:16,
    borderRadius:12
  },
  input:{
    width:"100%",
    padding:10,
    marginTop:8,
    borderRadius:8
  },
  save:{
    marginTop:20,
    width:"100%",
    padding:12,
    background:"#7c3aed",
    border:"none",
    borderRadius:10,
    color:"white"
  },

  /* MODAL */
  modal:{
    position:"fixed",
    top:0,
    left:0,
    width:"100%",
    height:"100%",
    background:"rgba(0,0,0,0.7)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center"
  },
  modalCard:{
    background:"#1e293b",
    padding:20,
    borderRadius:12,
    width:"90%",
    maxWidth:400
  }
};