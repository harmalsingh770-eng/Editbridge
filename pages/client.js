"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });
    return () => unsub();
  }, []);

  const startChat = async () => {
    const chatRef = await addDoc(collection(db, "chats"), {
      clientId: user.uid,
      editorId: "L0S5natsSmWjrHCcYqPpIihdRri1",
      createdAt: serverTimestamp(),
    });

    router.push(`/chat/${chatRef.id}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Client Dashboard</h2>
      <button onClick={startChat}>Start Chat</button>
    </div>
  );
}