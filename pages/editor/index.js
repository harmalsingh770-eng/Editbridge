"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Editor() {
  const [data, setData] = useState({
    name: "",
    skills: "",
    price: "",
    portfolioLink: ""
  });

  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snap = await getDoc(doc(db, "editors", uid));
      if (snap.exists()) {
        setData(snap.data());
      }
    };
    load();
  }, []);

  const save = async () => {
    const uid = auth.currentUser.uid;

    await setDoc(doc(db, "editors", uid), {
      ...data,
      skills: data.skills.split(",")
    });

    alert("Saved");
  };

  return (
    <div style={s.page}>
      <h2>Editor Dashboard</h2>

      <input placeholder="Name" onChange={e => setData({...data, name:e.target.value})}/>
      <input placeholder="Skills (comma)" onChange={e => setData({...data, skills:e.target.value})}/>
      <input placeholder="Price" onChange={e => setData({...data, price:e.target.value})}/>
      <input placeholder="Portfolio Link" onChange={e => setData({...data, portfolioLink:e.target.value})}/>

      <button onClick={save}>Save</button>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
    color: "white"
  }
};