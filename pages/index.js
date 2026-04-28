import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div style={s.page}>
      <h1 style={s.title}>💜 EditBridge</h1>

      <div style={s.box}>
        <button onClick={() => router.push("/login?type=client")} style={s.btn}>
          Client Login
        </button>

        <button onClick={() => router.push("/login?type=editor")} style={s.btn}>
          Editor Login
        </button>

        <button onClick={() => router.push("/admin-login")} style={s.admin}>
          Admin
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white"
  },
  title: { fontSize: 32, marginBottom: 30 },
  box: { display: "flex", flexDirection: "column", gap: 15 },
  btn: {
    padding: 12,
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 10
  },
  admin: {
    padding: 12,
    background: "#ef4444",
    border: "none",
    color: "white",
    borderRadius: 10
  }
};