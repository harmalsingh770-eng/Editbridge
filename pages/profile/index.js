import { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const save = async () => {
    await setDoc(doc(db, "editors", user.uid), {
      name,
      approved: false
    });

    alert("Saved");
  };

  return (
    <div>
      <input onChange={(e)=>setName(e.target.value)} />
      <button onClick={save}>Save</button>
    </div>
  );
}