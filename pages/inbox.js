import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";
import HomeButton from "../components/HomeButton";

export default function Inbox() {
  const [chats, setChats] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let unsub;

    const authUnsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");

      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", u.uid)
      );

      unsub = onSnapshot(q, (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      authUnsub();
      if (unsub) unsub();
    };
  }, []);

  return (
    <div style={s.page}>
      <HomeButton />

      <h2>Inbox</h2>

      {chats.map((c) => (
        <div key={c.id} onClick={() => router.push(`/chat/${c.id}`)}>
          {c.lastMessage}
        </div>
      ))}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: 20
  }
};