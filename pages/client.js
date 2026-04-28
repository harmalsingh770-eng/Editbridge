"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export default function ClientChat({ chatId }) {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef();

  // 🔥 Chat listener
  useEffect(() => {
    const chatRef = doc(db, "chats", chatId);

    const unsub = onSnapshot(chatRef, (snap) => {
      if (snap.exists()) setChat(snap.data());
    });

    return () => unsub();
  }, [chatId]);

  // 🔥 Messages listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "chats", chatId, "messages"),
      (snap) => {
        setMessages(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        scrollToBottom();
      }
    );

    return () => unsub();
  }, [chatId]);

  // 🔥 Online status
  useEffect(() => {
    const ref = doc(db, "chats", chatId);

    updateDoc(ref, { clientOnline: true });

    return () => {
      updateDoc(ref, { clientOnline: false });
    };
  }, [chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 🔥 Send message
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: "client",
      createdAt: serverTimestamp(),
      seen: false,
    });

    setText("");

    await updateDoc(doc(db, "chats", chatId), {
      typingClient: false,
    });
  };

  // 🔥 Typing
  const handleTyping = async (val) => {
    setText(val);

    await updateDoc(doc(db, "chats", chatId), {
      typingClient: val.length > 0,
    });
  };

  if (!chat) return null;

  if (chat.locked) {
    return <div className="text-center mt-20">🔒 Chat Locked</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      
      {/* Header */}
      <div className="p-4 border-b flex justify-between">
        <div>
          <h2>Editor</h2>
          <p className="text-xs text-green-400">
            {chat.editorOnline ? "Online" : "Offline"}
          </p>
        </div>
        <div className="text-xs">
          {chat.typingEditor && "Typing..."}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-[70%] ${
              msg.sender === "client"
                ? "ml-auto bg-blue-600"
                : "bg-gray-700"
            }`}
          >
            <p>{msg.text}</p>

            <div className="text-[10px] text-right mt-1 opacity-70">
              {msg.createdAt?.toDate().toLocaleTimeString()}
              {msg.sender === "client" && (
                <span>{msg.seen ? " ✓✓" : " ✓"}</span>
              )}
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
          className="bg-blue-600 px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}