import { useEffect, useState } from "react";
import Link from "next/link";
import { getApprovedEditors } from "../lib/db";

export default function HomePage() {
  const [editors, setEditors] = useState([]);

  useEffect(() => {
    setEditors(getApprovedEditors());
  }, []);

  return (
    <main style={{ padding: "20px" }}>
      <h1>🎬 EditBridge</h1>
      <p>Find and hire video editors</p>

      <Link href="/login">
        <button>Get Started</button>
      </Link>

      <h2>Approved Editors</h2>

      {editors.length === 0 ? (
        <p>No editors found</p>
      ) : (
        editors.map((e) => (
          <div key={e.id} style={{ border: "1px solid #ddd", margin: 10, padding: 10 }}>
            <h3>{e.name}</h3>
            <p>{e.bio}</p>
          </div>
        ))
      )}
    </main>
  );
}