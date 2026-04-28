import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      const snap = await getDocs(collection(db, "editors"));
      setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const startChat = async (editorId) => {
    const user = auth.currentUser;
    if (!user) return;

    const ids = [user.uid, editorId].sort();
    const chatId = ids.join("_");

    await setDoc(doc(db, "chats", chatId), {
      users: ids,
      createdAt: serverTimestamp(),
    }, { merge: true });

    router.push(`/chat/${chatId}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Editors</h2>

      {editors.map(e => (
        <div key={e.id} style={{ marginBottom: 10 }}>
          <b>{e.name}</b>

          <button
            onClick={() => router.push(`/pay/editor?editorId=${e.id}`)}
          >
            Pay ₹10
          </button>

          <button onClick={() => startChat(e.id)}>
            Chat
          </button>
        </div>
      ))}
    </div>
  );
}