import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchEditors = async () => {
      const snap = await getDocs(collection(db, "editors"));
      setEditors(snap.docs.map(doc => doc.data()));
    };

    fetchEditors();
  }, []);

  return (
    <div style={wrap}>
      <h1 style={title}>Editors Portfolio</h1>

      {editors.map((e, i) => (
        <div key={i} style={card}>
          <h3>{e.name}</h3>
          <p>{e.bio}</p>
          <p>₹{e.price}</p>

          <button style={lockedBtn} onClick={() => router.push("/payment")}>
            🔒 Unlock Chat (₹10)
          </button>
        </div>
      ))}
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  padding: "20px",
  background: "linear-gradient(135deg,#0f172a,#4c1d95)",
  color: "white",
};

const title = {
  textAlign: "center",
  marginBottom: "20px",
};

const card = {
  background: "#1e1b4b",
  padding: "20px",
  borderRadius: "15px",
  marginBottom: "15px",
};

const lockedBtn = {
  marginTop: "10px",
  padding: "10px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "10px",
};