import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [credits, setCredits] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchCredits = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      setCredits(snap.data()?.credits || 0);
    };

    fetchCredits();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Client Dashboard</h1>

      <h2>💰 Credits: {credits}</h2>

      <button onClick={() => router.push("/chat")}>
        Go to Chat
      </button>

      <button onClick={() => router.push("/payment")}>
        Buy Credits
      </button>
    </div>
  );
}