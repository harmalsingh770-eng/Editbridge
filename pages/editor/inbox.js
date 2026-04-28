"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function EditorInbox() {
  const [chats, setChats] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("editorId", "==", auth.currentUser.uid),
      where("visibleToEditor", "==", true)
    );

    const unsub = onSnapshot(q, (snap) => {
      setChats(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-4 bg-black min-h-screen text-white">
      <h1 className="text-xl mb-4">Inbox</h1>

      {chats.length === 0 && <p>No chats yet</p>}

      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => router.push(`/editor/chat/${chat.id}`)}
          className="p-3 mb-2 bg-gray-800 rounded cursor-pointer"
        >
          Client Chat
          <p className="text-xs text-green-400">
            {chat.clientOnline ? "Active" : "Offline"}
          </p>
        </div>
      ))}
    </div>
  );
}