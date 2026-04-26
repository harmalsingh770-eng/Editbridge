import { useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Login() {
  const router = useRouter();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account Created ✅");
        router.push("/");
      } else {
        await signInWithEmailAndPassword(auth, email, password);

        // Admin redirect
        if (email === "admin@editbridge.com") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
        color: "white",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#1c1c1c",
          padding: "30px",
          borderRadius: "12px"
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          {mode === "login" ? "Login" : "Signup"}
        </h1>

        <form onSubmit={handle}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Signup"}
          </button>
        </form>

        <p
          style={{
            marginTop: "15px",
            textAlign: "center",
            cursor: "pointer",
            color: "#00bfff"
          }}
          onClick={() =>
            setMode(mode === "login" ? "signup" : "login")
          }
        >
          {mode === "login"
            ? "No account? Signup"
            : "Already have account? Login"}
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #333",
  background: "#222",
  color: "white"
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#00bfff",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer"
};