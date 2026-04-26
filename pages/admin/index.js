import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

export default function Admin() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [paySnap, editorSnap] = await Promise.all([
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "editors"))
      ]);

      setPayments(
        paySnap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }))
      );

      setEditors(
        editorSnap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }))
      );
    } catch (err) {
      console.error(err);
      alert("Error loading admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      if (user.email?.toLowerCase() !== "admin@editbridge.com") {
        router.push("/");
        return;
      }

      loadData();
    });

    return () => unsub();
  }, [router, loadData]);

  // Payment actions
  const approvePayment = async (id) => {
    await updateDoc(doc(db, "payments", id), {
      status: "approved"
    });
    loadData();
  };

  const rejectPayment = async (id) => {
    await updateDoc(doc(db, "payments", id), {
      status: "rejected"
    });
    loadData();
  };

  // Editor approve
  const approveEditor = async (id) => {
    await updateDoc(doc(db, "editors", id), {
      approved: true
    });
    loadData();
  };

  const logoutNow = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <p style={styles.tag}>OWNER PANEL</p>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.sub}>
              Manage payments, users & editors
            </p>
          </div>

          <button style={styles.logoutBtn} onClick={logoutNow}>
            Logout
          </button>
        </div>

        {/* Stats */}
        <div style={styles.grid}>
          <div style={styles.card}>
            <h2>{payments.length}</h2>
            <p>Total Payments</p>
          </div>

          <div style={styles.card}>
            <h2>
              {payments.filter(
                (p) => p.status === "pending"
              ).length}
            </h2>
            <p>Pending Payments</p>
          </div>

          <div style={styles.card}>
            <h2>{editors.length}</h2>
            <p>Total Editors</p>
          </div>

          <div style={styles.card}>
            <h2>
              {
                editors.filter(
                  (e) => e.approved === true
                ).length
              }
            </h2>
            <p>Approved Editors</p>
          </div>
        </div>

        {/* Payments */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Payment Requests
          </h2>

          {payments.length === 0 ? (
            <p>No payments found.</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} style={styles.row}>
                <div>
                  <p style={styles.name}>{p.email}</p>
                  <p style={styles.status}>
                    Status: {p.status}
                  </p>
                </div>

                {p.status === "pending" && (
                  <div style={styles.flex}>
                    <button
                      style={styles.approve}
                      onClick={() =>
                        approvePayment(p.id)
                      }
                    >
                      Approve
                    </button>

                    <button
                      style={styles.reject}
                      onClick={() =>
                        rejectPayment(p.id)
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Editors */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Editors
          </h2>

          {editors.length === 0 ? (
            <p>No editors found.</p>
          ) : (
            editors.map((e) => (
              <div key={e.id} style={styles.row}>
                <div>
                  <p style={styles.name}>{e.name}</p>
                  <p style={styles.status}>
                    {e.approved
                      ? "Approved"
                      : "Pending"}
                  </p>
                </div>

                {!e.approved && (
                  <button
                    style={styles.approve}
                    onClick={() =>
                      approveEditor(e.id)
                    }
                  >
                    Approve
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
    color: "white",
    padding: "30px"
  },

  wrapper: {
    maxWidth: "1150px",
    margin: "auto"
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0c29",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "30px"
  },

  tag: {
    color: "#c4b5fd",
    fontSize: "12px",
    letterSpacing: "3px"
  },

  title: {
    margin: "5px 0",
    fontSize: "42px"
  },

  sub: {
    color: "#ddd"
  },

  logoutBtn: {
    background:
      "linear-gradient(90deg,#8b5cf6,#3b82f6)",
    border: "none",
    color: "white",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "18px",
    marginBottom: "30px"
  },

  card: {
    background: "rgba(255,255,255,0.08)",
    padding: "22px",
    borderRadius: "18px",
    backdropFilter: "blur(8px)"
  },

  section: {
    background: "rgba(255,255,255,0.08)",
    padding: "22px",
    borderRadius: "18px",
    marginBottom: "20px"
  },

  sectionTitle: {
    marginBottom: "18px"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    padding: "14px 0",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)"
  },

  name: {
    margin: 0,
    fontWeight: "bold"
  },

  status: {
    margin: "4px 0 0",
    color: "#ddd"
  },

  flex: {
    display: "flex",
    gap: "10px"
  },

  approve: {
    background:
      "linear-gradient(90deg,#7c3aed,#2563eb)",
    border: "none",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  reject: {
    background:
      "linear-gradient(90deg,#ef4444,#dc2626)",
    border: "none",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  }
};