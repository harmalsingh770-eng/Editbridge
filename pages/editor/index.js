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
      try {
        if (!u) {
          router.push("/editor-login");
          return;
        }

        setUser(u);

        const snap = await getDoc(doc(db, "editors", u.uid));

        if (!snap.exists()) {
          alert("Editor account not found.");
          router.push("/editor-login");
          return;
        }

        const data = snap.data();

        if (!data.approved) {
          alert("Your account is pending approval.");
          router.push("/editor-login");
          return;
        }

        setEditor(data);
      } catch (err) {
        console.log(err);
        router.push("/editor-login");
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const logout = async () => {
    await signOut(auth);
    router.push("/editor-login");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "white"
      }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px",
      background: "linear-gradient(135deg,#0f172a,#312e81,#581c87)",
      color: "white"
    }}>
      <h1 style={{ fontSize: "34px" }}>🎬 Editor Dashboard</h1>

      <div style={{
        marginTop: "30px",
        padding: "25px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.08)"
      }}>
        <h2>{editor?.name}</h2>
        <p>Email: {user?.email}</p>
        <p>Status: Approved ✅</p>
        <p>Skills: {editor?.skills?.join(", ")}</p>
        <p>Price: ₹{editor?.price}</p>
      </div>

      <div style={{ marginTop: "25px" }}>
        <button
          onClick={() => router.push(`/chat/admin_${user.uid}`)}
          style={btn}
        >
          💬 Chat With Admin
        </button>

        <button
          onClick={logout}
          style={btn2}
        >
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