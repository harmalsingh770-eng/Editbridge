import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Editor() {
  const router = useRouter();

  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);

  // editable fields
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login?type=editor");

      const ref = doc(db, "editors", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        router.replace("/login?type=editor");
        return;
      }

      const data = snap.data();

      if (!data.approved) {
        alert("Wait for admin approval");
        router.replace("/");
        return;
      }

      setEditor({ id: u.uid, ...data });

      setName(data.name || "");
      setSkills((data.skills || []).join(", "));
      setPrice(data.price || "");

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ✅ UPDATE PROFILE
  const updateProfile = async () => {
    try {
      await updateDoc(doc(db, "editors", editor.id), {
        name,
        skills: skills.split(",").map(s => s.trim()),
        price: Number(price)
      });

      alert("Updated successfully ✅");
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div style={s.center}>Loading...</div>;

  return (
    <div style={s.page}>
      <h1>🎬 Editor Dashboard</h1>

      <div style={s.card}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          style={s.input}
        />

        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="Skills (comma separated)"
          style={s.input}
        />

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price ₹"
          style={s.input}
        />

        <button onClick={updateProfile} style={s.save}>
          Save Profile
        </button>
      </div>

      <button
        style={s.btn}
        onClick={() => router.push("/editor/inbox")}
      >
        💬 Chat Inbox
      </button>

      <button style={s.logout} onClick={logout}>
        Logout
      </button>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "#020617",
    color: "white",
  },

  card: {
    padding: 20,
    background: "#111827",
    marginTop: 20,
    borderRadius: 12,
  },

  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    border: "none",
  },

  save: {
    marginTop: 15,
    padding: 10,
    background: "#22c55e",
    border: "none",
    color: "white",
  },

  btn: {
    marginTop: 20,
    padding: 12,
    background: "#7c3aed",
    border: "none",
    color: "white",
  },

  logout: {
    marginTop: 10,
    padding: 12,
    background: "#ef4444",
    border: "none",
    color: "white",
  },

  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};