import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Chat() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // 🔍 check payment
      const q = query(
        collection(db, "payments"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      let ok = false;

      snap.forEach((doc) => {
        if (doc.data().status === "approved") {
          ok = true;
        }
      });

      if (!ok) {
        router.push("/payment");
      } else {
        setAllowed(true);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <p>Checking access...</p>;
  if (!allowed) return null;

  return (
    <div style={{ padding: 20 }}>
      <h1>Chat Unlocked ✅</h1>
    </div>
  );
}