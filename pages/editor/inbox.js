import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";

export default function EditorInbox() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubChats;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/editor-login");

      const q = query(
        collection(db, "chats"),
        orderBy("lastUpdated", "desc")
      );

      unsubChats = onSnapshot(q, async (snap) => {
        const list = [];

        for (let d of snap.docs) {
          const data = d.data();

          if (!data.users?.includes(u.uid)) continue;

          const otherUser = data.users.find((id) => id !== u.uid);

          let name = "Client";

          try {
            const userSnap = await getDoc(doc(db, "users", otherUser));
            if (userSnap.exists()) {
              name = userSnap.data().name || "Client";
            }
          } catch {}

          list.push({
            id: d.id,
            lastMessage: data.lastMessage,
            name,
            updated: data.lastUpdated,
          });
        }

        setChats(list);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubChats) unsubChats();
    };
  }, []);

  if (loading) {
    return <div style={s.center}>Loading...</div>;
  }

  return (
    <div style={s.page}>
      <button onClick={() => router.push("/editor")} style={s.back}>
        ← Back
      </button>

      <h2>Inbox</h2>

      {chats.length === 0 ? (
        <p>No chats</p>
      ) : (
        chats.map((c) => (
          <div key={c.id} style={s.card} onClick={() => router.push(`/chat/${c.id}`)}>
            <b>{c.name}</b>
            <p>{c.lastMessage}</p>
          </div>
        ))
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "#020617",
    color: "white",
  },
  card: {
    padding: 12,
    background: "#1e293b",
    marginTop: 10,
  },
  back: { marginBottom: 10 },
  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};