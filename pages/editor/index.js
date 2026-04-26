import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function EditorDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/editor-login");
        return;
      }

      setUser(u);

      const ref = doc(db, "editors", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Editor profile not found");
        router.push("/");
        return;
      }

      setEditor(snap.data());
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const logout = async () => {
    await signOut(auth);
    router.push("/editor-login");
  };

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "linear-gradient(135deg,#0f172a,#312e81,#581c87)",
        color: "white"
      }}
    >
      <h1>🎬 Editor Dashboard</h1>

      <div
        style={{
          marginTop: "30px",
          padding: "25px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.08)"
        }}
      >
        <h2>{editor.name || "Editor"}</h2>
        <p>Email: {user.email}</p>
        <p>Status: {editor.approved ? "Approved ✅" : "Pending ⏳"}</p>
        <p>Skills: {editor.skills?.join(", ")}</p>
        <p>Price: ₹{editor.price}</p>
      </div>

      <div style={{ marginTop: "25px" }}>
        <button
          onClick={() => router.push(`/chat/admin_${user.uid}`)}
          style={btn}
        >
          💬 Chat With Admin
        </button>

        <button onClick={logout} style={btn2}>
          Logout
        </button>
      </div>
    </div>
  );
}

const btn = {
  padding: "14px 20px",
  border: "none",
  borderRadius: "12px",
  background: "#7c3aed",
  color: "white",
  marginRight: "10px",
  cursor: "pointer"
};

const btn2 = {
  padding: "14px 20px",
  border: "none",
  borderRadius: "12px",
  background: "#ef4444",
  color: "white",
  cursor: "pointer"
};