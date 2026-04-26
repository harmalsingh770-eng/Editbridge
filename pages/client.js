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

      const snap = await getDoc(doc(db, "users", u.uid));
      setCredits(snap.data()?.credits || 0);
    };
    load();
  }, []);

  const startChat = () => {
    if (credits < 10) {
      router.push("/payment");
      return;
    }

    const room = auth.currentUser.uid + "_editor1";
    router.push(`/chat?room=${room}`);
  };

  return (
    <div style={wrap}>
      
      {/* 💰 CREDIT FLOAT */}
      <div style={creditBox}>💰 {credits}</div>

      <h1 style={title}>Editors Marketplace</h1>

      <div style={card}>
        <h3>🎬 Pro Video Editor</h3>
        <p>Reels • YouTube • Ads</p>

        <button style={btn} onClick={startChat}>
          Start Chat (-10)
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
  background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
  color: "white"
};

const title = {
  textAlign: "center",
  marginBottom: "20px",
  fontSize: "28px"
};

const card = {
  background: "rgba(30,27,75,0.8)",
  padding: "20px",
  borderRadius: "15px",
  boxShadow: "0 0 25px rgba(139,92,246,0.5)"
};

const btn = {
  marginTop: "10px",
  width: "100%",
  padding: "10px",
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  border: "none",
  borderRadius: "10px",
  color: "white"
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
  color: "white"
};

const creditBox = {
  position: "fixed",
  top: 15,
  right: 15,
  background: "linear-gradient(135deg,#22c55e,#4ade80)",
  padding: "10px",
  borderRadius: "10px",
  fontWeight: "bold"
};