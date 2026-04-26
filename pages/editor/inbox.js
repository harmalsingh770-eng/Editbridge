import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs
} from "firebase/firestore";

export default function Inbox() {
  const router = useRouter();
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/editor-login");
        return;
      }

      const snap = await getDocs(collection(db, "messages"));

      const list = [];
      const ids = new Set();

      snap.docs.forEach((doc) => {
        const d = doc.data();

        if (d.chatId?.includes(u.uid)) {
          if (!ids.has(d.chatId)) {
            ids.add(d.chatId);
            list.push(d.chatId);
          }
        }
      });

      setChats(list);
    });

    return ()=>unsub();
  }, []);

  return (
    <div style={page}>
      <h1>📩 Inbox</h1>

      {chats.length === 0 ? (
        <p>No Chats Yet</p>
      ) : (
        chats.map((id) => (
          <div key={id} style={card}>
            <p>{id}</p>

            <button
              style={btn}
              onClick={()=>router.push(`/chat/${id}`)}
            >
              Open Chat
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const page={
minHeight:"100vh",
padding:"40px",
background:"#0f172a",
color:"white"
};

const card={
padding:"20px",
background:"#1e293b",
borderRadius:"15px",
marginTop:"15px"
};

const btn={
padding:"10px 16px",
background:"#8b5cf6",
color:"white",
border:"none",
borderRadius:"10px"
};