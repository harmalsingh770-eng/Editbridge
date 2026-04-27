import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setLoading(false);
        return;
      }

      try {
        // 🔥 CHECK ROLE FROM USERS COLLECTION
        const snap = await getDoc(doc(db, "users", u.uid));

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const role = snap.data().role;

        if (role === "editor") {
          router.replace("/editor");
        } else {
          router.replace("/client");
        }

      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <div style={{color:"white"}}>Loading...</div>;

  return (
    <div style={{color:"white", textAlign:"center", marginTop:100}}>
      <h1>🎬 EditBridge</h1>

      <button onClick={() => router.push("/login?type=client")}>
        Client Login
      </button>

      <button onClick={() => router.push("/login?type=editor")}>
        Editor Login
      </button>
    </div>
  );
}