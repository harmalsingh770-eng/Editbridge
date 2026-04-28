"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";

export default function Reviews({ editorId }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!editorId) return;

    const q = query(
      collection(db, "reviews"),
      where("editorId", "==", editorId),
      orderBy("createdAt", "desc"),
      limit(2) // 🔥 ONLY TOP 2
    );

    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => doc.data()));
    });

    return () => unsub();
  }, [editorId]);

  if (reviews.length === 0) {
    return <p style={{ fontSize: 12, opacity: 0.6 }}>No reviews yet</p>;
  }

  return (
    <div style={{ marginTop: 10 }}>
      {reviews.map((r, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          
          {/* ⭐ Stars */}
          <div style={{ color: "#facc15" }}>
            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
          </div>

          <p style={{ fontSize: 12, opacity: 0.8 }}>
            {r.message}
          </p>

        </div>
      ))}
    </div>
  );
}