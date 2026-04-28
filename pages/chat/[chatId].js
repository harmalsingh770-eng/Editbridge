"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [chat, setChat] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!chatId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "chats", chatId));
      setChat(snap.data());
    };

    load();

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMsgs(snap.docs.map(d => d.data()));
    });

    return () => unsub();
  }, [chatId]);

  if (!chat) return <div>Loading...</div>;

  const user = auth.currentUser;

  if (!chat.unlocked && user.uid === chat.clientId) {
  return (
    <div style={s.lock}>
      🔒 Chat Locked

      <button onClick={() => router.push(`/payment?chatId=${chatId}`)}>
        Pay ₹10
      </button>
    </div>
  );
}