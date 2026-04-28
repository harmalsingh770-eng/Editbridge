"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";

export default function Editor() {
  const router = useRouter();

  const [data, setData] = useState({
    name: "",
    skills: "",
    price: "",
    portfolioLink: "",
    bio: "",
    active: false
  });

  const [loading, setLoading] = useState(true);

  // 🔄 LOAD DATA
  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snap = await getDoc(doc(db, "editors", uid));

      if (snap.exists()) {
        const d = snap.data();

        setData({
          name: d.name || "",
          skills: (d.skills || []).join(","),
          price: d.price || "",
          portfolioLink: d.portfolioLink || "",
          bio: d.bio || "",
          active: d.active || false
        });
      }

      setLoading(false);
    };

    load();
  }, []);

  // 💾 SAVE
  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return alert("Not logged in");

    await setDoc(doc(db, "editors", uid), {
      name: data.name,
      skills: data.skills.split(",").map(s => s.trim()),
      price: data.price,
      portfolioLink: data.portfolioLink,
      bio: data.bio,
      active: data.active,
      updatedAt: new Date()
    });

    alert("Saved ✅");
  };

  // 🟢 TOGGLE ACTIVE
  const toggleActive = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const newStatus = !data.active;

    setData({ ...data, active: newStatus });

    await updateDoc(doc(db, "editors", uid), {
      active: newStatus
    });
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return <div style={s.loader}>Loading...</div>;
  }

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <h2>💜 Editor Dashboard</h2>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={s.inboxBtn}
            onClick={() => router.push("/editor/inbox")}
          >
            Inbox 💬
          </button>

          <button style={s.logout} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* ACTIVE TOGGLE */}
      <div style={s.activeBox}>
        <span>
          Status:{" "}
          <b style={{ color: data.active ? "#22c55e" : "#ef4444" }}>
            {data.active ? "Online" : "Offline"}
          </b>
        </span>

        <button
          style={{
            ...s.toggleBtn,
            background: data.active ? "#ef4444" : "#22c55e"
          }}
          onClick={toggleActive}
        >
          {data.active ? "Go Offline" : "Go Online"}
        </button>
      </div>

      {/* FORM */}
      <div style={s.card}>
        <input
          value={data.name}
          placeholder="Your Name"
          onChange={(e) =>
            setData({ ...data, name: e.target.value })
          }
          style={s.input}
        />

        <input
          value={data.skills}
          placeholder="Skills (comma separated)"
          onChange={(e) =>
            setData({ ...data, skills: e.target.value })
          }
          style={s.input}
        />

        <input
          value={data.price}
          placeholder="Price ₹"
          onChange={(e) =>
            setData({ ...data, price: e.target.value })
          }
          style={s.input}
        />

        <input
          value={data.portfolioLink}
          placeholder="Portfolio Link"
          onChange={(e) =>
            setData({ ...data, portfolioLink: e.target.value })
          }
          style={s.input}
        />

        <textarea
          value={data.bio}
          placeholder="Short Bio"
          onChange={(e) =>
            setData({ ...data, bio: e.target.value })
          }
          style={s.textarea}
        />

        <button style={s.save} onClick={save}>
          Save Portfolio
        </button>
      </div>
    </div>
  );
}

// 🎨 STYLES
const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white"
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  inboxBtn: {
    background: "#6366f1",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    color: "white"
  },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    color: "white"
  },

  activeBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    background: "rgba(30,27,75,0.6)",
    padding: 15,
    borderRadius: 12
  },

  toggleBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer"
  },

  card: {
    background: "rgba(30,27,75,0.6)",
    padding: 20,
    borderRadius: 15,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: "none"
  },

  textarea: {
    padding: 10,
    borderRadius: 8,
    border: "none",
    minHeight: 80
  },

  save: {
    marginTop: 10,
    padding: 12,
    background: "#22c55e",
    border: "none",
    borderRadius: 10,
    color: "white"
  }
};