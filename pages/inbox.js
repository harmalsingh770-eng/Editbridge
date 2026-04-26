import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;

      if (!user) {
        router.push("/login");
        return;
      }

      // 🔍 CHECK PAYMENT STATUS
      const q = query(
        collection(db, "payments"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      let approved = false;

      snap.forEach((doc) => {
        if (doc.data().status === "approved") {
          approved = true;
        }
      });

      if (!approved) {
        router.push("/payment");
      } else {
        setAllowed(true);
      }

      setLoading(false);
    };

    checkAccess();
  }, []);

  if (loading) return <p>Checking access...</p>;

  if (!allowed) return null;

  return (
    <div style={{ padding: 20 }}>
      <h1>Chat Unlocked ✅</h1>
      <p>You can now chat with editors</p>
    </div>
  );
}