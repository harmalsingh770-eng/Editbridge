"use client";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>💜 EditBridge</h1>
        <p style={s.sub}>Connect with pro editors instantly</p>

        <div style={s.row}>
          <button onClick={() => router.push("/login")} style={s.btn}>
            Client
          </button>

          <button onClick={() => router.push("/login?type=editor")} style={s.btnPrimary}>
            Editor
          </button>

          <button onClick={() => router.push("/admin-login")} style={s.btnDanger}>
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)" },
  card: { padding:40, borderRadius:20, background:"rgba(255,255,255,0.05)", backdropFilter:"blur(15px)", textAlign:"center" },
  title: { color:"#fff", fontSize:32 },
  sub: { color:"#aaa", marginBottom:20 },
  row: { display:"flex", gap:10 },
  btn: { padding:12, borderRadius:10, background:"#334155", color:"#fff" },
  btnPrimary: { padding:12, borderRadius:10, background:"#7c3aed", color:"#fff" },
  btnDanger: { padding:12, borderRadius:10, background:"#ef4444", color:"#fff" }
};