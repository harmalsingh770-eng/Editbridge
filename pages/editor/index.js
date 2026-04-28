"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Editor() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    price: "",
    skills: "",
    portfolio: []
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");

      setUser(u);

      const ref = doc(db, "editors", u.uid);
      const unsubDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) setProfile(snap.data());
      });

      return () => unsubDoc();
    });

    return () => unsub();
  }, []);

  const saveProfile = async () => {
    await setDoc(doc(db, "editors", user.uid), {
      ...profile,
      skills: Array.isArray(profile.skills)
        ? profile.skills
        : profile.skills.split(",").map(s => s.trim()),
      email: user.email,
      active: true,
      approved: true
    }, { merge: true });

    alert("✅ Saved");
  };

  const addPortfolio = () => {
    setProfile({
      ...profile,
      portfolio: [...(profile.portfolio || []), { title:"", link:"" }]
    });
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2>🎬 Editor Dashboard</h2>

        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>router.push("/editor/inbox")} style={s.inbox}>
            📩 Inbox
          </button>

          <button onClick={()=>signOut(auth)} style={s.logout}>
            Logout
          </button>
        </div>
      </div>

      <div style={s.card}>
        <input
          placeholder="Name"
          value={profile.name || ""}
          onChange={(e)=>setProfile({...profile,name:e.target.value})}
          style={s.input}
        />

        <textarea
          placeholder="Bio"
          value={profile.bio || ""}
          onChange={(e)=>setProfile({...profile,bio:e.target.value})}
          style={s.input}
        />

        <input
          placeholder="Skills"
          value={profile.skills?.join?.(", ") || profile.skills || ""}
          onChange={(e)=>setProfile({...profile,skills:e.target.value})}
          style={s.input}
        />

        <input
          placeholder="Price"
          value={profile.price || ""}
          onChange={(e)=>setProfile({...profile,price:e.target.value})}
          style={s.input}
        />
      </div>

      <div style={s.card}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <h3>Portfolio</h3>
          <button onClick={addPortfolio}>+ Add</button>
        </div>
      </div>

      <button onClick={saveProfile} style={s.save}>
        Save Profile
      </button>
    </div>
  );
}

const s = {
  page:{padding:20,color:"white",background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",minHeight:"100vh"},
  header:{display:"flex",justifyContent:"space-between",marginBottom:20},
  logout:{background:"#ef4444",padding:"8px 14px",border:"none",borderRadius:8,color:"white"},
  inbox:{background:"#7c3aed",padding:"8px 14px",border:"none",borderRadius:8,color:"white"},
  card:{background:"#1e293b",padding:15,borderRadius:12,marginBottom:15},
  input:{width:"100%",padding:10,marginTop:8,borderRadius:8,border:"none"},
  save:{width:"100%",padding:12,background:"#7c3aed",border:"none",borderRadius:10,color:"white"}
};