import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    skills: "",
    price: "",
    bio: "",
    drive: "",
    photo: "",
    active: true,
    duty: ""
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);

      const snap = await getDoc(doc(db, "editors", u.uid));
      if (snap.exists()) {
        setForm({
          ...form,
          ...snap.data(),
          skills: snap.data().skills?.join(", ") || ""
        });
      }
    });
  }, []);

  const update = (key, value) =>
    setForm({ ...form, [key]: value });

  const save = async () => {
    await setDoc(doc(db, "editors", user.uid), {
      ...form,
      skills: form.skills.split(",").map((s) => s.trim())
    }, { merge: true });

    alert("Profile Updated ✅");
  };

  return (
    <div style={page}>
      <div style={card}>
        <h1>⚙️ Editor Settings</h1>

        <input placeholder="Name"
          value={form.name}
          onChange={(e)=>update("name",e.target.value)}
          style={input} />

        <input placeholder="Skills (comma separated)"
          value={form.skills}
          onChange={(e)=>update("skills",e.target.value)}
          style={input} />

        <input placeholder="Price ₹"
          value={form.price}
          onChange={(e)=>update("price",e.target.value)}
          style={input} />

        <textarea placeholder="Bio"
          value={form.bio}
          onChange={(e)=>update("bio",e.target.value)}
          style={textarea} />

        <input placeholder="Google Drive Link"
          value={form.drive}
          onChange={(e)=>update("drive",e.target.value)}
          style={input} />

        <input placeholder="Profile Photo URL"
          value={form.photo}
          onChange={(e)=>update("photo",e.target.value)}
          style={input} />

        <input placeholder="Duty Time (9AM - 6PM)"
          value={form.duty}
          onChange={(e)=>update("duty",e.target.value)}
          style={input} />

        <label style={{display:"block",marginTop:"10px"}}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e)=>update("active",e.target.checked)}
          /> Online
        </label>

        <button onClick={save} style={btn}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

const page={
minHeight:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"linear-gradient(135deg,#0f172a,#1e1b4b,#581c87)",
padding:"20px"
};

const card={
width:"100%",
maxWidth:"500px",
background:"rgba(255,255,255,0.08)",
padding:"30px",
borderRadius:"20px",
color:"white"
};

const input={
width:"100%",
padding:"12px",
marginTop:"12px",
borderRadius:"12px",
border:"none"
};

const textarea={
...input,
height:"100px"
};

const btn={
width:"100%",
padding:"14px",
marginTop:"18px",
background:"#8b5cf6",
color:"white",
border:"none",
borderRadius:"12px",
fontWeight:"bold"
};