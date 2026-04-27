import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Inbox() {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);

      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", u.uid)
      );

      onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // SORT BY LAST MESSAGE
        data.sort((a, b) => b.lastMessageAt?.seconds - a.lastMessageAt?.seconds);

        setChats(data);
      });
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2>Inbox</h2>

      {chats.map((c) => (
        <div
          key={c.id}
          onClick={() => router.push(`/chat/${c.id}`)}
          style={{
            padding: 12,
            borderBottom: "1px solid #222",
            cursor: "pointer",
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {c.lastSender || "Unknown"}
          </div>

          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {c.lastMessage}
          </div>
        </div>
      ))}
    </div>
  );
}