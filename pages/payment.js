import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Payment() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [txn, setTxn] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "payments"), {
      userId: user.uid,
      email: user.email,
      txnId: txn,
      status: "pending",
      createdAt: new Date()
    });

    alert("Submitted");
  };

  return (
    <form onSubmit={submit}>
      <input onChange={(e)=>setTxn(e.target.value)} />
      <button>Submit</button>
    </form>
  );
}