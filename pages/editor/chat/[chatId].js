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

  const bottomRef = useRef();

  // 🔥 Chat listener
  useEffect(() => {
    if (!chatId) return;

    const ref = doc(db, "chats", chatId);

    const unsub = onSnapshot(ref, (snap) => {
      setChat(snap.data());
    });

    return () => unsub();
  }, [chatId]);

  // 🔥 Messages
  useEffect(() => {
    if (!chatId) return;

    const unsub = onSnapshot(
      collection(db, "chats", chatId, "messages"),
      async (snap) => {
        const msgs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setMessages(msgs);

        // ✅ Seen ticks
        msgs.forEach(async (msg) => {
          if (msg.sender === "client" && !msg.seen) {
            await updateDoc(
              doc(db, "chats", chatId, "messages", msg.id),
              { seen: true }
            );
          }
        });

        scrollToBottom();
      }
    );

    return () => unsub();
  }, [chatId]);

  // 🔥 Online status
  useEffect(() => {
    if (!chatId) return;

    const ref = doc(db, "chats", chatId);

    updateDoc(ref, { editorOnline: true });

    return () => {
      updateDoc(ref, { editorOnline: false });
    };
  }, [chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 🔥 Send
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: "editor",
      createdAt: serverTimestamp(),
      seen: false,
    });

    setText("");

    await updateDoc(doc(db, "chats", chatId), {
      typingEditor: false,
    });
  };

  // 🔥 Typing
  const handleTyping = async (val) => {
    setText(val);

    await updateDoc(doc(db, "chats", chatId), {
      typingEditor: val.length > 0,
    });
  };

  if (!chat) return <div className="text-white p-5">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-black text-white">

      {/* Header */}
      <div className="p-4 border-b flex justify-between">
        <div>
          <h2>Client</h2>
          <p className="text-xs text-green-400">
            {chat?.clientOnline ? "Active" : "Offline"}
          </p>
        </div>
        <div className="text-xs">
          {chat?.typingClient && "Typing..."}
        </div>
      </div>

      {/* Messages */}
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

      {/* Input */}
      <div className="p-3 flex gap-2 border-t">
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800"
          placeholder="Type..."
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