"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from "firebase/firestore";

export default function Reviews({ editorId }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!editorId) return;

    const q = query(
      collection(db, "reviews"),
      where("editorId", "==", editorId),
      orderBy("createdAt", "desc"),
      limit(3) // top 3 latest reviews
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => doc.data());
      setReviews(data);
    });

    return () => unsub();
  }, [editorId]);

  // ⭐ average rating
  const avg =
    reviews.length > 0
      ? (
          reviews.reduce((a, b) => a + Number(b.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : 0;

  if (reviews.length === 0) {
    return (
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
        No reviews yet
      </p>
    );
  }

  return (
    <div style={s.wrap}>
      
      {/* ⭐ Average */}
      <div style={s.avg}>
        ⭐ {avg} / 5 ({reviews.length})
      </div>

      {/* ⭐ List */}
      {reviews.map((r, i) => (
        <div key={i} style={s.review}>
          
          {/* Stars */}
          <div style={s.stars}>
            {"★".repeat(Number(r.rating || 0))}
            {"☆".repeat(5 - Number(r.rating || 0))}
          </div>

          {/* Message */}
          <p style={s.msg}>
            {r.message}
          </p>

        </div>
      ))}
    </div>
  );
}

const s = {
  wrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.1)"
  },

  avg: {
    fontSize: 12,
    marginBottom: 6,
    color: "#facc15"
  },

  review: {
    marginBottom: 8
  },

  stars: {
    color: "#facc15",
    fontSize: 14
  },

  msg: {
    fontSize: 12,
    opacity: 0.8
  }
};