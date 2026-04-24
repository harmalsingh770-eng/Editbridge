import { useState } from "react";
import { useRouter } from "next/router";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebase";

export default function LoginPage() {
  const router = useRouter();
  const auth = getAuth(app);

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created ✅");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login success ✅");
        router.push("/");
      }
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        auth,
        "admin@editbridge.com",
        "Gurnek191108"
      );
      alert("Admin Login ✅");
      router.push("/admin");
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0f0f0f",
      color: "white"
    }}>
      <div style={{
        width: "300px",
        padding: "20px",
        border: "1px solid #333",
        borderRadius: "10px"
      }}>
        
        <h2 style={{ textAlign: "center" }}>
          {mode === "login" ? "Login" : "Signup"}
        </h2>

        <button onClick={handleAdminLogin}>
          ⚡ Admin Login
        </button>

        <form onSubmit={handleSubmit}>

          {mode === "signup" && (
            <input
              placeholder="Name"
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", marginTop: "10px" }}
            />
          )}

          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginTop: "10px" }}
            required
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginTop: "10px" }}
            required
          />

          <button type="submit" style={{ marginTop: "10px" }}>
            {loading ? "Loading..." : mode}
          </button>
        </form>

        <p style={{ marginTop: "10px" }}>
          {mode === "login" ? "No account?" : "Already have account?"}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? " Signup" : " Login"}
          </button>
        </p>

      </div>
    </div>
  );
}