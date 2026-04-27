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

  const role = type === "editor" ? "editor" : "client";

  // ✅ LOGIN
  const login = async () => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    const userSnap = await getDoc(doc(db, "users", uid));

    if (!userSnap.exists()) {
      alert("User data missing");
      return;
    }

    const userRole = userSnap.data().role;

    if (userRole === "editor") {
      router.push("/editor");
    } else {
      router.push("/client");
    }
  };

  // ✅ SIGNUP
  const signup = async () => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    // 🔥 USERS COLLECTION (IMPORTANT)
    await setDoc(doc(db, "users", uid), {
      email,
      role
    });

    // 🔥 IF EDITOR → ALSO CREATE EDITOR PROFILE
    if (role === "editor") {
      await setDoc(doc(db, "editors", uid), {
        email,
        name: "New Editor",
        skills: [],
        price: 0,
        approved: false
      });

      alert("Wait for admin approval");
      return;
    }

    router.push("/client");
  };

  return (
    <div style={{padding:40}}>
      <h1>{role.toUpperCase()} LOGIN</h1>

      <input placeholder="Email" onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />

      <button onClick={login}>Login</button>
      <button onClick={signup}>Signup</button>
    </div>
  );
}