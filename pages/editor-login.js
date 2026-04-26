import { useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailAndPassword
} from "firebase/auth";
import {
  doc,
  getDoc
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

export default function EditorLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);

      const uid = res.user.uid;

      // check editor profile
      const snap = await getDoc(doc(db, "editors", uid));

      if (!snap.exists()) {
        alert("Editor profile not found");
        return;
      }

      const data = snap.data();

      if (!data.approved) {
        alert("Your account is pending approval");
        return;
      }

      // success
      router.push("/editor");

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <form onSubmit={handleLogin} style={{
        background: "#1e293b",
        padding: "30px",
        borderRadius: "15px",
        width: "350px"
      }}>
        <h1>Editor Login</h1>

        <input
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
          style={{width:"100%",padding:"10px",marginTop:"10px"}}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
          style={{width:"100%",padding:"10px",marginTop:"10px"}}
        />

        <button style={{
          width:"100%",
          padding:"10px",
          marginTop:"15px",
          background:"purple",
          color:"white",
          border:"none"
        }}>
          Login
        </button>
      </form>
    </div>
  );
}