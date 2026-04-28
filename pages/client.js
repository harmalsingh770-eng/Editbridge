"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/router";
import Reviews from "../components/Reviews";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "editors"), (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEditors(data.filter(e => e.approved && e.active));
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const openChat = (editorId) => {
    const user = auth.currentUser;
    if (!user) return router.push("/login");

    const chatId = [user.uid, editorId].sort().join("_");

    router.push(`/chat/${chatId}`);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1>🎬 EditBridge</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={s.grid}>
        {editors.map(e => (
          <div key={e.id} style={s.card}>
            <h2>{e.name}</h2>
            <p>{e.bio}</p>
            <p>{e.skills?.join(", ")}</p>
            <p>₹{e.price}</p>

            {e.portfolio?.map((link, i) => (
              <a key={i} href={link} target="_blank">
                Portfolio {i + 1}
              </a>
            ))}

            <button onClick={() => openChat(e.id)}>
              Chat
            </button>

            <Reviews editorId={e.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { padding: 20, color: "white", background: "#020617" },
  header: { display: "flex", justifyContent: "space-between" },
  grid: { display: "grid", gap: 20, marginTop: 20 },
  card: { padding: 20, background: "#1e293b", borderRadius: 12 }
};