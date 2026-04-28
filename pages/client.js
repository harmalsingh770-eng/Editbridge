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
    onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });
  }, []);

  const startChat = async () => {
    const chatRef = await addDoc(collection(db, "chats"), {
      clientId: user.uid,
      editorId: "PUT_EDITOR_UID",
      createdAt: serverTimestamp(),
      clientOnline: true,
      editorOnline: false,
      typingClient: false,
      typingEditor: false,
    });

    router.push(`/chat/${chatRef.id}`);
  };

  return (
    <div style={styles.container}>
      <h2>Client Dashboard</h2>
      <button style={styles.button} onClick={startChat}>
        Start Chat 🚀
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    textAlign: "center",
  },
  button: {
    padding: "12px 20px",
    background: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};