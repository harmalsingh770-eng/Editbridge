"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Editor() {
  const [chats, setChats] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return router.push("/login");

      const q = query(
        collection(db, "chats"),
        where("editorId", "==", user.uid)
      );

      onSnapshot(q, (snap) => {
        setChats(snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })));
      });
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Editor Inbox</h2>

      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => router.push(`/chat/${chat.id}`)}
          style={{
            padding: 10,
            margin: 10,
            background: "#eee",
            cursor: "pointer"
          }}
        >
          Chat {chat.id}
        </div>
      ))}
    </div>
  );
}