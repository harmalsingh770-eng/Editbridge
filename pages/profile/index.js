import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "" });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  const save = async () => {
    await setDoc(doc(db, "editors", user.uid), {
      ...form,
      approved: false
    });
  };

  return (
    <div>
      <input onChange={(e)=>setForm({name:e.target.value})} />
      <button onClick={save}>Save</button>
    </div>
  );
}