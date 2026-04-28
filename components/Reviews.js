"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";

// ⭐ Star UI
function Stars({ value = 0 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            color: i <= value ? "#facc15" : "#334155",
            fontSize: 14
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Reviews({ editorId }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!editorId) return;

    const q = query(
      collection(db, "reviews"),
      where("editorId", "==", editorId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const top2 = snap.docs.slice(0, 2).map((doc) => doc.data());
      setReviews(top2);
    });

    return () => unsub();
  }, [editorId]);

  return (
    <div style={s.wrap}>
      {reviews.length === 0 && (
        <p style={s.empty}>No reviews yet</p>
      )}

      {reviews.map((r, i) => (
        <div key={i} style={s.card}>
          <div style={s.top}>
            <Stars value={r.rating} />
            <span style={s.email}>{r.clientEmail}</span>
          </div>

          <p style={s.msg}>{r.message}</p>
        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: { marginTop: 10 },

  empty: { fontSize: 12, opacity: 0.6 },

  card: {
    background: "rgba(15,23,42,0.8)",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    border: "1px solid rgba(255,255,255,0.08)"
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },

  email: {
    fontSize: 11,
    opacity: 0.6
  },

  msg: {
    fontSize: 13
  }
};