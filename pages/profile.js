import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAuth } from "firebase/auth";
import { app } from "../../firebase";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

export default function EditorProfile() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    skills: "",
    portfolio: "",
    price: ""
  });

  // 🔐 Check login
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
    });
    return () => unsub();
  }, []);

  // 📥 Load existing profile
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const ref = doc(db, "editors", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setForm({
          name: data.name || "",
          bio: data.bio || "",
          skills: (data.skills || []).join(", "),
          portfolio: (data.portfolio || []).join("\n"),
          price: data.price || ""
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // 💾 Save profile
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await setDoc(doc(db, "editors", user.uid), {
        name: form.name,
        bio: form.bio,
        skills: form.skills.split(",").map(s => s.trim()),
        portfolio: form.portfolio.split("\n").map(s => s.trim()),
        price: form.price,
        approved: false // 🔥 admin will approve
      });

      alert("Profile saved ✅ Waiting for admin approval");
    } catch (err) {
      alert(err.message);
    }

    setSaving(false);
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  return (
    <div style={{
      maxWidth: "500px",
      margin: "auto",
      padding: "20px",
      color: "white",
      background: "#0f0f0f",
      minHeight: "100vh"
    }}>
      <h1>Editor Profile</h1>

      <form onSubmit={handleSave}>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ width: "100%", marginTop: "10px" }}
        />

        <textarea
          placeholder="Bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          style={{ width: "100%", marginTop: "10px" }}
        />

        <input
          placeholder="Skills (comma separated)"
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          style={{ width: "100%", marginTop: "10px" }}
        />

        <textarea
          placeholder="Portfolio links (one per line)"
          value={form.portfolio}
          onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
          style={{ width: "100%", marginTop: "10px" }}
        />

        <input
          type="number"
          placeholder="Price ₹"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          style={{ width: "100%", marginTop: "10px" }}
        />

        <button type="submit" style={{ marginTop: "10px" }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>

      </form>
    </div>
  );
}