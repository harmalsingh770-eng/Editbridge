"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function EditorInbox() {
  const [chats, setChats] = useState([]);
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) return router.push("/login");

      const q = query(
        collection(db, "chats"),
        where("editorId", "==", user.uid)
      );

      onSnapshot(q, (snap) => {
        setChats(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Inbox</h2>

      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => router.push(`/chat/${chat.id}`)}
          style={{
            padding: 15,
            background: "#111",
            color: "#fff",
            marginBottom: 10,
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Chat #{chat.id.slice(0, 6)}
        </div>
      ))}
    </div>
  );
}