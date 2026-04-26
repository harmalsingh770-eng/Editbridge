import Link from "next/link";

export default function Home() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>EditBridge</h1>
        <p style={styles.text}>
          Hire video editors or become one.
        </p>

        <div style={styles.row}>
          <Link href="/login" style={styles.btn}>
            Login
          </Link>

          <Link href="/editor-register" style={styles.btn2}>
            Become Editor
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#0f172a,#312e81,#581c87)",
    padding: "20px"
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    padding: "40px",
    borderRadius: "20px",
    color: "white",
    textAlign: "center",
    maxWidth: "500px",
    width: "100%"
  },
  title: {
    fontSize: "42px",
    marginBottom: "10px"
  },
  text: {
    opacity: 0.9
  },
  row: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginTop: "25px",
    flexWrap: "wrap"
  },
  btn: {
    padding: "12px 20px",
    background: "#7c3aed",
    color: "white",
    borderRadius: "10px",
    textDecoration: "none"
  },
  btn2: {
    padding: "12px 20px",
    background: "#2563eb",
    color: "white",
    borderRadius: "10px",
    textDecoration: "none"
  }
};