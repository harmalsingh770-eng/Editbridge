"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [credits, setCredits] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const u = auth.currentUser;
      if (!u) return;

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.log("User doc missing");
        return;
      }

      setCredits(snap.data().credits || 0);
    };

    load();
  }, []);

  const startChat = () => {
    if (!auth.currentUser) return;

    if (credits < 10) {
      router.push("/payment");
      return;
    }

    const room = auth.currentUser.uid + "_editor1";
    router.push(`/chat?room=${room}`);
  };

  return (
    <div style={wrap}>

      {/* 💰 CREDIT DISPLAY */}
      <div style={creditBox}>
        💰 {credits}
      </div>

      <h1 style={title}>✨ Editors Marketplace</h1>

      <div style={card}>
        <h3>🎬 Pro Video Editor</h3>
        <p>Reels • YouTube • Ads</p>

        <button style={btn} onClick={startChat}>
          Start Chat (-10 credits)
        </button>
      </div>

      <div style={nav}>
        <button style={navBtn} onClick={()=>router.push("/payment")}>
          Buy Credits
        </button>

        <button style={navBtn} onClick={()=>router.push("/inbox")}>
          Inbox
        </button>
      </div>

    </div>
  );
}

/* UI */
const wrap = {
  minHeight: "100vh",
  padding: "20px",
  background: "radial-gradient(circle,#020617,#0f172a,#4c1d95)",
  color: "white"
};

const title = {
  textAlign: "center",
  marginBottom: "25px",
  fontSize: "28px",
  fontWeight: "bold"
};

const card = {
  background: "rgba(30,27,75,0.8)",
  padding: "20px",
  borderRadius: "20px",
  boxShadow: "0 0 30px rgba(139,92,246,0.5)",
  backdropFilter: "blur(10px)"
};

const btn = {
  marginTop: "15px",
  width: "100%",
  padding: "12px",
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  border: "none",
  borderRadius: "12px",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer"
};

const nav = {
  marginTop: "20px",
  display: "flex",
  gap: "10px"
};

const navBtn = {
  flex: 1,
  padding: "10px",
  background: "#22c55e",
  border: "none",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer"
};

const creditBox = {
  position: "fixed",
  top: 15,
  right: 15,
  background: "linear-gradient(135deg,#22c55e,#4ade80)",
  padding: "10px 15px",
  borderRadius: "12px",
  fontWeight: "bold",
  boxShadow: "0 0 10px rgba(34,197,94,0.6)"
};