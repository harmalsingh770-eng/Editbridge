import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs
} from "firebase/firestore";

export default function ClientPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);

      const snap = await getDocs(collection(db, "editors"));

      const approvedEditors = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(item => item.approved === true);

      setEditors(approvedEditors);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Client Dashboard...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.logo}>🎬 EditBridge</h1>
          <p style={styles.small}>Welcome back</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p style={styles.email}>{user?.email}</p>

          <button onClick={logout} style={styles.logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <h2 style={styles.heroTitle}>
          Find Skilled Video Editors
        </h2>

        <p style={styles.heroText}>
          Connect with talented editors and grow your content.
        </p>
      </div>

      {/* Marketplace */}
      <h2 style={styles.section}>🔥 Marketplace Editors</h2>

      {editors.length === 0 ? (
        <p style={{ color: "#cbd5e1" }}>
          No approved editors yet.
        </p>
      ) : (
        <div style={styles.grid}>
          {editors.map((editor) => (
            <div key={editor.id} style={styles.card}>
              <h3>{editor.name}</h3>

              <p style={styles.cardText}>
                🎯 Skills: {editor.skills?.join(", ") || "Not Added"}
              </p>

              <p style={styles.cardText}>
                💰 Price: ₹{editor.price || "N/A"}
              </p>

              <p style={styles.cardText}>
                🟢 Status: {editor.active ? "Online" : "Offline"}
              </p>

              <button
                onClick={() =>
                  router.push(`/chat/${user.uid}_${editor.id}`)
                }
                style={styles.chatBtn}
              >
                💬 Chat Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    background:
      "linear-gradient(135deg,#0f172a,#1e1b4b,#581c87)",
    color: "white"
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white"
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    flexWrap: "wrap",
    gap: "20px"
  },

  logo: {
    margin: 0,
    fontSize: "32px"
  },

  small: {
    color: "#cbd5e1"
  },

  email: {
    fontSize: "14px",
    color: "#e2e8f0"
  },

  logout: {
    marginTop: "8px",
    padding: "10px 16px",
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: "10px",
    cursor: "pointer"
  },

  hero: {
    padding: "30px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.08)",
    marginBottom: "35px"
  },

  heroTitle: {
    fontSize: "34px",
    marginBottom: "10px"
  },

  heroText: {
    color: "#cbd5e1"
  },

  section: {
    marginBottom: "20px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: "20px"
  },

  card: {
    background: "rgba(255,255,255,0.08)",
    padding: "22px",
    borderRadius: "18px",
    backdropFilter: "blur(10px)"
  },

  cardText: {
    color: "#cbd5e1",
    marginTop: "8px"
  },

  chatBtn: {
    marginTop: "18px",
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    background: "#8b5cf6",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  }
};