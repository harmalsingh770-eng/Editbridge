"use client";

import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  doc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chat, setChat] = useState(null);

  const bottomRef = useRef();

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);

    const unsubChat = onSnapshot(chatRef, (docSnap) => {
      setChat(docSnap.data());
    });

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubMsg = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubChat();
      unsubMsg();
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ONLINE STATUS
  useEffect(() => {
    if (!user || !chatId) return;

    const chatRef = doc(db, "chats", chatId);

    updateDoc(chatRef, {
      clientOnline: true,
    });

    return () => {
      updateDoc(chatRef, {
        clientOnline: false,
      });
    };
  }, [user, chatId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp(),
      seen: false,
    });

    setText("");
  };

  // TYPING
  const handleTyping = async (val) => {
    setText(val);

    await updateDoc(doc(db, "chats", chatId), {
      typingClient: true,
    });

    setTimeout(async () => {
      await updateDoc(doc(db, "chats", chatId), {
        typingClient: false,
      });
    }, 1000);
  };

  // SEEN
  useEffect(() => {
    messages.forEach(async (msg) => {
      if (msg.sender !== user?.uid && !msg.seen) {
        await updateDoc(
          doc(db, "chats", chatId, "messages", msg.id),
          { seen: true }
        );
      }
    });
  }, [messages]);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <span>Chat</span>
        <span style={{ fontSize: 12 }}>
          {chat?.editorOnline ? "🟢 Online" : "⚫ Offline"}
        </span>
      </div>

      {/* MESSAGES */}
      <div style={styles.messages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.sender === user?.uid ? "right" : "left",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: 10,
                borderRadius: 10,
                background:
                  msg.sender === user?.uid ? "#4caf50" : "#222",
                color: "#fff",
                maxWidth: "70%",
              }}
            >
              {msg.text}

              <div style={{ fontSize: 10, marginTop: 5 }}>
                {msg.createdAt?.toDate().toLocaleTimeString()}
              </div>

              {msg.sender === user?.uid && (
                <div style={{ fontSize: 10 }}>
                  {msg.seen ? "✓✓ Seen" : "✓ Sent"}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      {/* TYPING */}
      {chat?.typingEditor && (
        <div style={{ fontSize: 12 }}>Typing...</div>
      )}

      {/* INPUT */}
      <div style={styles.inputBox}>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.send}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f172a",
    color: "#fff",
  },
  header: {
    padding: 15,
    background: "#111",
    display: "flex",
    justifyContent: "space-between",
  },
  messages: {
    flex: 1,
    overflowY: "scroll",
    padding: 10,
  },
  inputBox: {
    display: "flex",
    padding: 10,
    background: "#111",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "none",
  },
  send: {
    marginLeft: 10,
    padding: "10px 15px",
    background: "#4caf50",
    border: "none",
    borderRadius: 8,
    color: "#fff",
  },
};