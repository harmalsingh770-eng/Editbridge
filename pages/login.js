import { useRouter } from "next/router";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Login() {
  const router = useRouter();
  const { type } = router.query;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🔐 LOGIN
  const login = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      const ref = doc(db, "users", userCred.user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("User data missing");
        return;
      }

      const role = snap.data().role;

      if (role === "client") router.push("/client");
      else if (role === "editor") router.push("/editor");
      else router.push("/client");

    } catch (err) {
      alert(err.message);
    }
  };

  // 🆕 SIGNUP
  const signup = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        email: email,
        role: "client",
        credits: 0,
        chatUnlocked: false
      });

      router.push("/client");

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1>🚀 Login</h1>

        <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} style={input}/>
        <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} style={input}/>

        <button onClick={login} style={btn}>Login</button>
        <button onClick={signup} style={signupBtn}>Create Account</button>
      </div>
    </div>
  );
}

/* UI (futuristic) */
const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "radial-gradient(circle,#020617,#0f172a,#4c1d95)"
};

const card = {
  padding: "30px",
  borderRadius: "20px",
  background: "rgba(30,27,75,0.7)",
  backdropFilter: "blur(15px)",
  boxShadow: "0 0 40px rgba(139,92,246,0.5)",
  width: "320px",
  color: "white"
};

const input = {
  width: "100%",
  padding: "12px",
  marginTop: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#0f172a",
  color: "white"
};

const btn = {
  width: "100%",
  marginTop: "15px",
  padding: "12px",
  background: "linear-gradient(135deg,#06b6d4,#6366f1)",
  border: "none",
  borderRadius: "10px",
  color: "white"
};

const signupBtn = {
  width: "100%",
  marginTop: "10px",
  padding: "12px",
  background: "#22c55e",
  border: "none",
  borderRadius: "10px",
  color: "white"
};