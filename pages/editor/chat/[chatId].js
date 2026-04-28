"use client";

import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db } from "../../../lib/firebase";
import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function EditorChat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chat, setChat] = useState(null);
  const [ready, setReady] = useState(false);

  const bottomRef = useRef();

  // ✅ WAIT until chatId exists
  useEffect(() => {
    if (!router.isReady || !chatId) return;
    setReady(true);
  }, [router.isReady, chatId]);

  // 🔥 Chat listener
  useEffect(() => {
    if (!ready) return;

    const ref = doc(db, "chats", chatId);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setChat(snap.data());
      }
    });

    return () => unsub();
  }, [ready]);

  // 🔥 Messages
  useEffect(() => {
    if (!ready) return;

    const unsub = onSnapshot(
      collection(db, "chats", chatId, "messages"),
      async (snap) => {
        const msgs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setMessages(msgs);

        // seen
        for (let msg of msgs) {
          if (msg.sender === "client" && !msg.seen) {
            await updateDoc(
              doc(db, "chats", chatId, "messages", msg.id),
              { seen: true }
            );
          }
        }

        scrollToBottom();
      }
    );

    return () => unsub();
  }, [ready]);

  // 🔥 Online status (SAFE)
  useEffect(() => {
    if (!ready) return;

    const ref = doc(db, "chats", chatId);

    const setOnline = async () => {
      try {
        await updateDoc(ref, { editorOnline: true });
      } catch (e) {}
    };

    setOnline();

    return () => {
      updateDoc(ref, { editorOnline: false }).catch(() => {});
    };
  }, [ready]);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async () => {
    if (!text.trim() || !ready) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: "editor",
      createdAt: serverTimestamp(),
      seen: false,
    });

    setText("");

    updateDoc(doc(db, "chats", chatId), {
      typingEditor: false,
    }).catch(() => {});
  };

  const handleTyping = async (val) => {
    setText(val);

    if (!ready) return;

    updateDoc(doc(db, "chats", chatId), {
      typingEditor: val.length > 0,
    }).catch(() => {});
  };

  // ✅ Loading state (IMPORTANT)
  if (!ready) {
    return <div className="text-white p-5">Loading chat...</div>;
  }

  if (!chat) {
    return <div className="text-white p-5">Chat not found</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white">

      <div className="p-4 border-b flex justify-between">
        <div>
          <h2>Client</h2>
          <p className="text-xs text-green-400">
            {chat.clientOnline ? "Active" : "Offline"}
          </p>
        </div>
        <div className="text-xs">
          {chat.typingClient && "Typing..."}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-[70%] ${
              msg.sender === "editor"
                ? "ml-auto bg-green-600"
                : "bg-gray-700"
            }`}
          >
            <p>{msg.text}</p>
            <div className="text-[10px] text-right opacity-70">
              {msg.createdAt?.toDate().toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="p-3 flex gap-2 border-t">
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800"
        />
        <button
          onClick={sendMessage}
          className="bg-green-600 px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}